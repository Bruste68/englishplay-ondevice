import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/user.model';

dotenv.config();

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer {token}

  if (!token) {
    res.status(401).json({ message: '토큰 없음' });
    return;
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (err) {
    res.status(403).json({ message: '토큰 오류' });
    return;
  }

  // 비동기 처리: async 대신 then/catch
  User.findByPk(decoded.id)
    .then((user: User | null) => {
      if (!user) {
        res.status(401).json({ message: '사용자 정보 없음' });
        return;
      }

      (req as any).user = user; // 타입 확장 필요 시 `types/express/index.d.ts` 참고
      next();
    })
    .catch((err: any) => {
      console.error('사용자 조회 오류:', err);
      res.status(500).json({ message: '서버 오류' });
    });
}
