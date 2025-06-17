// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import passport from 'passport';
import bcrypt from 'bcrypt';
import { Strategy as JwtStrategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { Strategy as LocalStrategy, IVerifyOptions } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as NaverStrategy } from 'passport-naver-v2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as YahooStrategy } from 'passport-yahoo-oauth';
import { Strategy as LineStrategy } from 'passport-line';
import { Request } from 'express';

import { AUTH_CONFIG, GOOGLE_CONFIG } from './auth';
import AuthService from '../services/auth.service';
import OAuthService from '../services/oauth.service';

type Provider = 'google' | 'facebook' | 'naver' | 'line' | 'yahoo' | 'kakao';

type ProviderConfig = {
  clientId?: string;
  clientSecret?: string;
  callbackURL: string;
  profileFields?: string[];
  scope?: string | string[];
  channelID?: string; // for Line
  channelSecret?: string;
  botPrompt?: string;
};

const validateEnvVars = (provider: Provider, requiredVars: string[]): boolean => {
  const missingVars = requiredVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    console.warn(`⚠️ ${provider} OAuth 환경변수 누락: ${missingVars.join(', ')}`);
    return false;
  }
  return true;
};

passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      (req: Request) => req.cookies?.jwt,
    ]),
    secretOrKey: AUTH_CONFIG.JWT_SECRET!,
  },
  async (payload: any, done: VerifiedCallback) => {
    try {
      const user = await AuthService.findUserById(payload.userId);
      return user ? done(null, user) : done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }
));

passport.use(new LocalStrategy(
  {
    usernameField: 'id',
    passwordField: 'password',
    passReqToCallback: true,
  },
  async (
    req: Request,
    id: string,
    password: string,
    done: (error: any, user?: Express.User | false, options?: IVerifyOptions) => void
  ) => {
    try {
      const user = await AuthService.findUserById(id);
      if (!user) return done(null, false, { message: '존재하지 않는 사용자입니다.' });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

const setupOAuthStrategy = (
  provider: Provider,
  Strategy: any,
  requiredVars: string[],
  config: ProviderConfig,
  profileHandler: (profile: any) => Promise<any>
) => {
  if (!validateEnvVars(provider, requiredVars)) return;

  passport.use(new Strategy(
    config,
    async (accessToken: string, refreshToken: string, profile: any, done: VerifiedCallback) => {
      try {
        const user = await profileHandler(profile);
        return done(null, user);
      } catch (err) {
        console.error(`${provider} OAuth 처리 오류:`, err);
        return done(err, false);
      }
    }
  ));
};

setupOAuthStrategy('google', GoogleStrategy, [], {
  clientID: GOOGLE_CONFIG.WEB.CLIENT_ID!,
  clientSecret: GOOGLE_CONFIG.WEB.CLIENT_SECRET!,
  callbackURL: 'https://samspeakgo.com/api/oauth/google/callback',
  scope: ['profile', 'email']
}, async (profile) => {
  return OAuthService.findOrCreateSNSUser({
    provider: 'google',
    snsId: profile.id,
    name: profile.displayName || 'Google User',
    email: profile.emails?.[0]?.value || `${profile.id}@google.com`,
  });
});

setupOAuthStrategy('facebook', FacebookStrategy, [], {
  clientID: process.env.FACEBOOK_CLIENT_ID!,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL!,
  profileFields: ['id', 'emails', 'name', 'picture.type(large)']
}, async (profile) => {
  return OAuthService.findOrCreateSNSUser({
    provider: 'facebook',
    snsId: profile.id,
    name: profile.displayName || 'Facebook User',
    email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
  });
});

setupOAuthStrategy('naver', NaverStrategy, [], {
  clientID: process.env.NAVER_CLIENT_ID!,
  clientSecret: process.env.NAVER_CLIENT_SECRET!,
  callbackURL: process.env.NAVER_CALLBACK_URL!,
}, async (profile) => {
  return OAuthService.findOrCreateSNSUser({
    provider: 'naver',
    snsId: profile.id,
    name: profile.displayName || 'Naver User',
    email: profile.email || `${profile.id}@naver.com`,
  });
});

setupOAuthStrategy('kakao', KakaoStrategy, [], {
  clientID: process.env.KAKAO_REST_API_KEY!,
  callbackURL: process.env.KAKAO_REDIRECT_URI!,
}, async (profile) => {
  return OAuthService.findOrCreateSNSUser({
    provider: 'kakao',
    snsId: profile.id,
    name: profile.displayName || 'Kakao User',
    email: profile._json?.kakao_account?.email || `${profile.id}@kakao.com`,
  });
});

setupOAuthStrategy('line', LineStrategy, [], {
  channelID: process.env.LINE_CHANNEL_ID!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
  callbackURL: process.env.LINE_CALLBACK_URL!,
  scope: ['profile', 'openid', 'email'],
  botPrompt: 'normal'
}, async (profile) => {
  return OAuthService.findOrCreateSNSUser({
    provider: 'line',
    snsId: profile.id,
    name: profile.displayName || 'Line User',
    email: profile.email || `${profile.id}@line.com`,
  });
});

setupOAuthStrategy('yahoo', YahooStrategy, [], {
  consumerKey: process.env.YAHOO_CLIENT_ID!,
  consumerSecret: process.env.YAHOO_CLIENT_SECRET!,
  callbackURL: process.env.YAHOO_CALLBACK_URL!,
}, async (profile) => {
  return OAuthService.findOrCreateSNSUser({
    provider: 'yahoo',
    snsId: profile.id,
    name: profile.displayName || 'Yahoo User',
    email: profile.emails?.[0]?.value || `${profile.id}@yahoo.com`,
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.log('🔄 등록된 Passport 전략 목록:', Object.keys((passport as any)._strategies));

export default passport;
