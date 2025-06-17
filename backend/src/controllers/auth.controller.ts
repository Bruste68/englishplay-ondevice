import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/user.model';
import { AUTH_CONFIG } from '../config/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ message: '아이디는 필수입니다.' });
      return;
    }

    let user = await User.findOne({ where: { userId: username } });

    if (!user) {
      const userKey = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1년 후

      user = await User.create({
        userId: username,
        userKey,
        provider: 'local',
        trial_start_at: now,
        premium_expires_at: expiresAt,
        password: 'default-password',
        name: 'guest',
        birth: new Date('2000-01-01'),
      });
    }

    const now = new Date();
    const trialStart = user.trial_start_at;
    const isTrialExpired =
      trialStart instanceof Date &&
      trialStart.getTime() + 3 * 24 * 60 * 60 * 1000 < now.getTime();

    const token = jwt.sign(
      {
        userId: user.userId,
        userKey: user.userKey,
        expiresAt: user.premium_expires_at,
        trialExpired: isTrialExpired,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      },
      AUTH_CONFIG.JWT_SECRET!
    );

    res.json({
      token,
      user: {
        id: user.userId,
        userKey: user.userKey,
        trialStartAt: user.trial_start_at,
        premiumExpiresAt: user.premium_expires_at,
        trialExpired: isTrialExpired,
      },
    });
  } catch (error: any) {
    console.error('❌ 로그인 실패:', error.message);
    res.status(500).json({ message: '서버 내부 오류', error: error.message });
  }
};
