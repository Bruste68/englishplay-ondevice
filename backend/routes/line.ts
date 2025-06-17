// backend/routes/line.ts
import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../config/auth';
import AuthService from '../services/auth.service';
import User from '../models/user.model'; // 필요 시 모델 import

const router = express.Router();

router.get('/oauth/line', (req, res) => {
  const redirectUri = encodeURIComponent(process.env.LINE_CALLBACK_URL!);
  const state = Math.random().toString(36).substring(2, 10);
  const clientId = process.env.LINE_CHANNEL_ID!;

  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=openid%20profile%20email&prompt=consent`;

  res.redirect(authUrl);
});

router.get('/oauth/line/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const tokenRes = await axios.post(
      'https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: process.env.LINE_CALLBACK_URL!,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const idToken = tokenRes.data.id_token;
    const decoded = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());

    const user = await AuthService.findOrCreateSNSUser({
      provider: 'line' as any, // 타입 우회 처리
      snsId: decoded.sub,
      name: decoded.name || 'LINE User',
      email: decoded.email || null,
    });

    const token = jwt.sign({ userId: (user as any).user_id }, AUTH_CONFIG.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.redirect(`englishplayondevice://login-success?token=${token}`);
  } catch (err) {
    console.error('LINE login error:', err);
    res.redirect('/login?error=line');
  }
});

export default router;