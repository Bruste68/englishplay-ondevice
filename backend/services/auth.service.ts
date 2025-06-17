import bcrypt from 'bcrypt';
import User from '../models/user.model';
import { AUTH_CONFIG } from '../config/auth';
import db from '../db';

class AuthService {
  async findUserByEmail(email: string) {
    console.log('[findUserByEmail] 이메일:', email);
    return User.findOne({ where: { email } });
  }

  async findUserById(user_id: string) {
    console.log('🔍 DB에서 user_id로 조회:', user_id);
    console.log('[findUserById] 아이디:', user_id);
    return User.findOne({ where: { user_id } });
  }

  async validateUser(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      console.log('[validateUser] 사용자 없음');
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log('[validateUser] 비밀번호 일치 여부:', isValid);
    return isValid ? user : null;
  }

  async createUser({
    id,
    password,
    name,
    birth,
  }: {
    id: string;
    password: string;
    name: string;
    birth: string;
  }) {
    console.log('[createUser] 입력값:', { id, password, name, birth });

    try {
      const hashedPassword = await bcrypt.hash(password, AUTH_CONFIG.SALT_ROUNDS);
      const userPayload = {
        user_id: id,
        name: name || '사용자',
        birth: new Date(birth),
        email: null,
        password: hashedPassword,
        profile_image: null, // null → 빈 문자열로 수정
        trial_start_at: new Date(),
      };

      console.log('[createUser] DB에 저장할 값:', userPayload);

      return await User.create(userPayload);
    } catch (err) {
      console.error('🔥 [createUser] 사용자 생성 실패:', err);
      throw err;
    }
  }

  async findOrCreateSNSUser({
    provider,
    snsId,
    name,
    email,
  }: {
    provider: 'google' | 'kakao' | 'facebook' | 'local' | 'yahoo' | 'naver';
    snsId: string;
    name: string;
    email?: string;
  }) {
    console.log('[SNS 로그인] provider:', provider, '| snsId:', snsId);
    const [user] = await User.findOrCreate({
      where: {
        provider,
        provider_id: snsId,
      },
      defaults: {
        user_id: `user_${Date.now()}`,
        name,
        email,
        birth: new Date('2000-01-01'),
        provider,
        provider_id: snsId,
        password: `${provider}_${snsId}`,
        trial_start_at: new Date(),
      },
    });

    return user;
  }
}

export default new AuthService();
