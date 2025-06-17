import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model';
import { AUTH_CONFIG } from '../config/auth';
import db from '../db';

class AuthService {
  async findUserById(userId: string) {
    console.log('🔍 [findUserById] 아이디로 사용자 조회 시도:', userId);
    const user = await User.findOne({ where: { userId } });
    if (user) {
      console.log('✅ 사용자 발견:', user.userId);
    } else {
      console.warn('❌ userId로 사용자 없음:', userId);
    }
    return user;
  }

  async createUser({
    id,
    password,
    name,
    birth,
    email = undefined,
    provider = 'local',
  }: {
    id: string;
    password: string;
    name: string;
    birth: string;
    email?: string;
    provider?: 'google' | 'kakao' | 'facebook' | 'local' | 'yahoo' | 'naver' | 'line';
  }) {
    console.log('🆕 [createUser] 회원가입 요청 수신:', { id, name, birth, email, provider });
    console.log('생성될 userId 길이:', id.length);

    try {
      const hashedPassword = await bcrypt.hash(password, AUTH_CONFIG.SALT_ROUNDS);
      const userPayload = {
        userId: id.slice(0, 190),
        name: name || '사용자',
        birth: new Date(birth),
        email,
        password: hashedPassword,
        provider,
        profile_image: '',
        trial_start_at: new Date(),
      };

      console.log('💾 DB에 저장할 유저 정보:', {
        ...userPayload,
        password: '*****',
      });

      const newUser = await User.create(userPayload);
      console.log('[createUser] DB 저장 완료:', newUser.userId);
      return newUser;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('🔥 [createUser] 사용자 생성 실패 - 상세 에러:', {
          message: err.message,
          stack: err.stack,
          sql: (err as any).sql,
        });
      } else {
        console.error('🔥 [createUser] 알 수 없는 에러 발생:', err);
      }
      throw err;
    }
  }

  async findOrCreateSNSUser({
    provider,
    snsId,
    name,
    email,
  }: {
    provider: 'google' | 'kakao' | 'facebook' | 'local' | 'yahoo' | 'naver' | 'line';
    snsId: string;
    name: string;
    email?: string;
  }) {
    console.log('🌐 [findOrCreateSNSUser] SNS 로그인 시도:', { provider, snsId });

    try {
      const user = await User.findOne({ where: { provider, provider_id: snsId } });
      if (user) {
        return user;
      }

      const userId = `u_${provider}_${snsId.substring(0, 10)}`;
      console.log('강제 줄인 userId:', userId);
      console.log('=== ID 생성 디버그 ===');
      console.log('원본 snsId 길이:', snsId.length);
      console.log('생성된 userId 길이:', userId.length);
      console.log('최종 userId:', userId);

      if (userId.length > 255) {
        throw new Error(`Generated userId is too long: ${userId.length} characters`);
      }

      const newUser = await User.create({
        userId,
        name,
        email,
        birth: new Date('2000-01-01'),
        provider,
        provider_id: snsId,
        password: crypto.randomBytes(16).toString('hex'),
        trial_start_at: new Date(),
      });

      console.log('✅ 신규 SNS 사용자 생성:', newUser.userId);
      return newUser;
    } catch (err: any) {
      console.error('❌ 심각한 에러 발생:', {
        message: err.message,
        sql: err.sql,
        parameters: err.parameters,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        stack: err.stack,
      });
      throw err;
    }
  }

  async findOrCreateOAuthUser(profile: {
    email: string;
    name: string;
    oauthId: string;
    provider: 'google';
  }): Promise<User> {
    return this.findOrCreateSNSUser({
      provider: profile.provider,
      snsId: profile.oauthId,
      name: profile.name,
      email: profile.email,
    });
  }

  generateJWT(user: { userId: string; email: string }) {
    return jwt.sign(
      { userId: user.userId, email: user.email },
      AUTH_CONFIG.JWT_SECRET!,
      { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN as SignOptions['expiresIn'] }
    );
  }
}

export default new AuthService();
