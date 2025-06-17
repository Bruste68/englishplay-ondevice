// routes/naver.ts
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../config/auth';

const router = express.Router();

// 네이버 로그인 시작
router.get('/oauth/naver', passport.authenticate('naver', { scope: ['profile'] }));

// 콜백 처리
router.get(
  '/oauth/naver/callback',
  passport.authenticate('naver', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // 로그인 성공 시 JWT 발급
    const user = req.user as any;
    const token = jwt.sign({ userId: user.id }, AUTH_CONFIG.JWT_SECRET, {
      expiresIn: '7d',
    });

    // 프론트로 리디렉트하며 토큰 전달 (예: 쿼리 파라미터)
    res.redirect(`https://samspeakgo.com/login-success?token=${token}`);
  }
);

export default router;
