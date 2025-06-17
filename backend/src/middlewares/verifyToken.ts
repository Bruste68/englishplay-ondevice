import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

interface JwtPayload {
  userId: string;
  email: string;
}

// ✅ 타입 확장 제거: req.user는 나중에 커스텀 타입으로 처리해도 OK
export async function verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  console.log('🛡️ JWT 인증 요청:', { authHeader, token });

  if (!token) {
    console.warn('🚫 토큰 없음 - 인증 실패');
    res.status(401).json({ message: '토큰 없음' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    console.log('✅ 토큰 디코딩 성공:', decoded);

    const user = await User.findOne({ where: { userId: decoded.userId } });
    if (!user) {
      console.warn('🚫 유효하지 않은 사용자');
      res.status(401).json({ message: '유효하지 않은 사용자입니다.' });
      return;
    }

    // 🔐 req.user에 user 할당 (타입 충돌 방지)
    (req as any).user = user;

    next();
  } catch (err: any) {
    console.error('❌ 토큰 검증 실패 또는 DB 오류:', err);

    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ message: '토큰 만료됨' });
    } else {
      res.status(403).json({ message: '유효하지 않은 토큰' });
    }
  }
}
