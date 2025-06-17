import { Request, Response } from 'express';
import { AUTH_CONFIG } from '../config/auth';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import AuthService from '../services/auth.service';

export class OAuthController {
  static async handleGoogleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        res.status(400).json({ error: 'Access token is required' });
        return;
      }

      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const { email, name, picture } = response.data;

      if (!email) {
        res.status(401).json({ error: 'Failed to fetch user info from Google' });
        return;
      }

      const user = await AuthService.findOrCreateSNSUser({
        provider: 'google',
        snsId: email, // 고유 이메일을 SNS ID로 간주
        name: name || 'Google User',
        email,
      });

      const token = jwt.sign(
        { userId: user.user_id, email: user.email },
        AUTH_CONFIG.JWT_SECRET as string,
        {
          expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN as `${number}s` | `${number}d`,
        }
      );

      res.json({
        token,
        user: {
          id: user.user_id,
          email: user.email,
          name: user.name,
          avatar: user.profile_image,
          trialExpired: !!user.trial_start_at,
        },
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.status(500).json({ error: 'OAuth authentication failed' });
    }
  }
}
