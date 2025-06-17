import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: '토큰이 없습니다.' });
    return;
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded; // ✅ 반드시 필요
    next();
  } catch (err) {
    res.status(403).json({ message: '토큰이 유효하지 않습니다.' });
    return;
  }

  User.findOne({ where: { user_id: decoded.user_id } })
    .then((user) => {
      if (!user) {
        res.status(401).json({ message: '유효하지 않은 사용자입니다.' });
        return;
      }

      req.user = user;
      next();
    })
    .catch((err) => {
      console.error('DB 오류:', err);
      res.status(500).json({ message: '서버 오류' });
    });
}
