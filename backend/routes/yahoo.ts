// backend/routes/yahoo.ts
import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../config/auth';
import AuthService from '../services/auth.service';

const router = express.Router();

// Step 1: Redirect to Yahoo OAuth
router.get('/oauth/yahoo', (req, res) => {
  const redirectUri = encodeURIComponent(process.env.YAHOO_CALLBACK_URL!);
  const clientId = process.env.YAHOO_CLIENT_ID!;
  const state = Math.random().toString(36).substring(2, 10);

  const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email&state=${state}`;
  res.redirect(authUrl);
});

// Step 2: Yahoo redirects back to here
router.get('/oauth/yahoo/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Step 3: Exchange code for token
    const tokenRes = await axios.post(
      'https://api.login.yahoo.com/oauth2/get_token',
      new URLSearchParams({
        client_id: process.env.YAHOO_CLIENT_ID!,
        client_secret: process.env.YAHOO_CLIENT_SECRET!,
        redirect_uri: process.env.YAHOO_CALLBACK_URL!,
        code: code as string,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // Step 4: Get user info
    const userInfoRes = await axios.get('https://api.login.yahoo.com/openid/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfo = userInfoRes.data;
    const user = await AuthService.findOrCreateSNSUser({
      provider: 'yahoo',
      snsId: userInfo.sub,
      name: userInfo.name || 'YahooUser',
      email: userInfo.email,
    });

    // Step 5: Issue JWT
    const token = jwt.sign({ userId: user.user_id }, AUTH_CONFIG.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Step 6: Redirect to app (deep link)
    res.redirect(`englishplayondevice://login-success?token=${token}`);
  } catch (err) {
    console.error('Yahoo login failed:', err);
    res.redirect('/login?error=yahoo');
  }
});

export default router;
