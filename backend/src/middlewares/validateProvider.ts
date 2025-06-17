import { Request, Response, NextFunction } from 'express';

const VALID_PROVIDERS = ['google', 'facebook', 'naver', 'line', 'yahoo', 'kakao'];

export const validateProvider = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const provider = req.path.split('/')[1]; // /google/callback → 'google'

  if (!VALID_PROVIDERS.includes(provider)) {
    console.error(`🚫 Invalid provider: ${provider}`);
    res.status(400).json({ error: '지원하지 않는 공급자입니다' });
    return;
  }

  next();
};
