import express from 'express';
import asyncHandler from 'express-async-handler';
import { OAuthController } from '../controllers/oauth.controller';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 통합 Google OAuth 엔드포인트
router.post('/google', asyncHandler(OAuthController.handleGoogleAuth));

// 페이스북 로그인 시작
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// 페이스북 로그인 콜백
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const user = req.user as any;
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.redirect(`https://samspeakgo.com/oauth/success?token=${token}`);
  }
);

export default router;