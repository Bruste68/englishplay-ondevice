import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../config/auth';
import AuthService from '../services/auth.service';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📥 로그인 요청:', req.body);

    const { id, password } = req.body;

    if (!id || !password) {
      res.status(400).json({ success: false, message: '아이디와 비밀번호는 필수입니다.' });
      return;
    }

    const user = await AuthService.findUserById(id);
    if (!user) {
      res.status(401).json({ error: '존재하지 않는 사용자입니다.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
      return;
    }

    const payload = { userId: user.user_id, email: user.email };
    const token = jwt.sign(
      payload,
      AUTH_CONFIG.JWT_SECRET as string,
      {
        expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        avatar: user.profile_image,
        trialExpired: !!user.trial_start_at,
      },
    });
  } catch (error: any) {
    console.error('❌ 로그인 실패:', error.message);
    res.status(500).json({ error: '내부 서버 오류', details: error.message });
  }
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, password, name, birth } = req.body;

    const existingUser = await AuthService.findUserById(id);
    if (existingUser) {
      res.status(400).json({ success: false, message: '이미 사용 중인 아이디입니다' });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
      res.status(400).json({ success: false, message: '생년월일은 YYYY-MM-DD 형식으로 입력해주세요' });
      return;
    }

    const newUser = await AuthService.createUser({ id, password, name, birth });

    const payload = { userId: newUser.user_id, email: newUser.email };
    const token = jwt.sign(
      payload,
      AUTH_CONFIG.JWT_SECRET as string,
      {
        expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN
      }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.user_id,
        name: newUser.name,
        trialExpired: !!newUser.trial_start_at,
      },
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ success: false, message: '회원가입 처리 중 오류가 발생했습니다' });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      console.warn('❌ userId 누락 - 인증되지 않은 요청');
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await AuthService.findUserById(userId);
    if (!user) {
      console.warn('❌ 사용자 없음 - ID:', userId);
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        avatar: user.profile_image,
        trialExpired: !!user.trial_start_at,
      },
    });
  } catch (error) {
    console.error('🔥 /api/me 처리 중 에러:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: '이메일이 필요합니다.' });
      return;
    }

    const user = await AuthService.findUserByEmail(email);
    res.json({ exists: !!user });
  } catch (error) {
    console.error('이메일 확인 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};
