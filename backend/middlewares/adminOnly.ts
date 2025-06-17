// backend/middlewares/adminOnly.ts
import { Request, Response, NextFunction } from 'express';

export default function adminOnly(req: Request, res: Response, next: NextFunction): void {
  const user = req.user as any;

  if (user?.is_admin === true) {
    next();
    return;
  }

  res.status(403).json({ message: '관리자 권한이 필요합니다.' });
}
