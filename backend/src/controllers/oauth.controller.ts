import { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import OAuthService from '../services/oauth.service';
import { AUTH_CONFIG } from '../config/auth';

type ProviderType = 'google' | 'facebook' | 'naver' | 'line' | 'yahoo' | 'kakao';

export class OAuthController {
  private static async handleCommonAuth(
    provider: ProviderType,
    req: Request,
    tokenHandler: (token: string) => Promise<any>
  ) {
    try {
      const { accessToken, code, client = 'web' } = req.body;

      if (!['app', 'web'].includes(client)) {
        throw new Error('Invalid client type');
      }

      const isApp = client === 'app';
      const envPrefix = provider.toUpperCase();
      const clientId = isApp
        ? process.env[`${envPrefix}_ANDROID_CLIENT_ID`]
        : process.env[`${envPrefix}_WEB_CLIENT_ID`];
      const clientSecret = isApp ? undefined : process.env[`${envPrefix}_WEB_CLIENT_SECRET`];
      const redirectUri =
        typeof req.body.redirectUri === 'string' && req.body.redirectUri.trim() !== ''
          ? req.body.redirectUri
          : isApp
            ? process.env[`${envPrefix}_ANDROID_REDIRECT_URI`]
            : process.env[`${envPrefix}_WEB_REDIRECT_URI`];

      if (!clientId || (!isApp && !clientSecret) || !redirectUri) {
        throw new Error('Missing OAuth configuration');
      }

      let token = accessToken;
      if (!token && code) {
        const tokenData = await OAuthController.exchangeCodeForToken(
          provider,
          code,
          clientId,
          clientSecret,
          redirectUri
        );
        token = tokenData.access_token;
      }

      if (!token) throw new Error('Access token is required');

      const userInfo = await tokenHandler(token);

      const user = await OAuthService.findOrCreateSNSUser({
        provider,
        snsId: userInfo.id,
        name: userInfo.name || `${provider} User`,
        email: userInfo.email,
      });

      const jwtToken = jwt.sign(
        { userId: user.userId, email: user.email },
        AUTH_CONFIG.JWT_SECRET!,
        {
          expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
        }
      );

      return {
        token: jwtToken,
        user: {
          id: user.userId,
          email: user.email,
          name: user.name,
          avatar: user.profile_image,
          trialExpired: user.trial_start_at
            ? new Date(user.trial_start_at).getTime() + 7 * 24 * 60 * 60 * 1000 < Date.now()
            : false,
        },
      };
    } catch (error: any) {
      console.error(`❌ ${provider} OAuth error:`, error);
      throw error;
    }
  }

  private static async exchangeCodeForToken(
    provider: ProviderType,
    code: string,
    clientId: string,
    clientSecret?: string,
    redirectUri?: string
  ) {
    const payload: Record<string, string> = {
      code,
      client_id: clientId,
      redirect_uri: redirectUri || '',
      grant_type: 'authorization_code',
    };

    if (clientSecret) payload.client_secret = clientSecret;

    let tokenUrl: string;
    switch (provider) {
      case 'google':
        tokenUrl = 'https://oauth2.googleapis.com/token';
        break;
      case 'facebook':
        tokenUrl = 'https://graph.facebook.com/v12.0/oauth/access_token';
        break;
      case 'naver':
        tokenUrl = 'https://nid.naver.com/oauth2.0/token';
        break;
      case 'line':
        tokenUrl = 'https://api.line.me/oauth2/v2.1/token';
        break;
      case 'yahoo':
        tokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';
        break;
      case 'kakao':
        tokenUrl = 'https://kauth.kakao.com/oauth/token';
        break;
      default:
        throw new Error('Unsupported provider');
    }

    const response = await axios.post(tokenUrl, new URLSearchParams(payload), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return response.data;
  }

  static async handleGoogleAuth(req: Request, res: Response) {
    try {
      const result = await OAuthController.handleCommonAuth('google', req, async (token) => {
        const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { id, email, name } = response.data;
        if (!id || !email) throw new Error('Failed to fetch user info');
        return { id, email, name };
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        error: 'Google authentication failed',
        details: error.message,
      });
    }
  }

  static async handleFacebookAuth(req: Request, res: Response) {
    try {
      const result = await OAuthController.handleCommonAuth('facebook', req, async (token) => {
        const response = await axios.get(
          `https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`
        );
        const { id, email, name } = response.data;
        if (!id || !email) throw new Error('Failed to fetch user info');
        return { id, email, name };
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        error: 'Facebook authentication failed',
        details: error.message,
      });
    }
  }

  static async handleNaverAuth(req: Request, res: Response) {
    try {
      const result = await OAuthController.handleCommonAuth('naver', req, async (token) => {
        const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { id, email, name } = response.data.response;
        if (!id || !email) throw new Error('Failed to fetch user info');
        return { id, email, name };
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        error: 'Naver authentication failed',
        details: error.message,
      });
    }
  }

  static async handleLineAuth(req: Request, res: Response) {
    try {
      const result = await OAuthController.handleCommonAuth('line', req, async (token) => {
        const response = await axios.get('https://api.line.me/v2/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { userId: id, displayName: name } = response.data;
        if (!id) throw new Error('Failed to fetch user info');
        return { id, email: `${id}@line-user.com`, name };
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        error: 'Line authentication failed',
        details: error.message,
      });
    }
  }

  static async handleYahooAuth(req: Request, res: Response) {
    try {
      const result = await OAuthController.handleCommonAuth('yahoo', req, async (token) => {
        const response = await axios.get('https://api.login.yahoo.com/openid/v1/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { sub: id, email, name } = response.data;
        if (!id || !email) throw new Error('Failed to fetch user info');
        return { id, email, name };
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        error: 'Yahoo authentication failed',
        details: error.message,
      });
    }
  }

  static async handleKakaoAuth(req: Request, res: Response) {
    try {
      const result = await OAuthController.handleCommonAuth('kakao', req, async (token) => {
        const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const kakaoAccount = response.data.kakao_account;
        const { id } = response.data;
        const email = kakaoAccount.email || `${id}@kakao-user.com`;
        const name = kakaoAccount.profile?.nickname || 'Kakao User';

        if (!id || !email) throw new Error('Failed to fetch user info');
        return { id, email, name };
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        error: 'Kakao authentication failed',
        details: error.message,
      });
    }
  }
}
