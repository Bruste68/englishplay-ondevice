import crypto from 'crypto';
import User from '../models/user.model';
import sequelize from '../db';

class OAuthService {
  private generateSNSUserId(provider: string, snsId: string): string {
    // 안정적이고 짧은 ID 생성 방식
    const hash = crypto.createHash('sha1').update(snsId).digest('hex').slice(0, 12);
    return `${provider}_${hash}`; // 예: "google_a1b2c3d4e5f6"
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
    const transaction = await sequelize.transaction();
    try {
      console.log('🌐 [OAuthService] SNS 로그인 시도 시작', {
        provider,
        snsId: snsId.length > 20 ? `${snsId.slice(0, 10)}...${snsId.slice(-5)}` : snsId,
        name,
        email,
      });

      // 기존 사용자 조회
      const existingUser = await User.findOne({
        where: { provider, provider_id: snsId },
        transaction
      });

      if (existingUser) {
        console.log('🧠 [OAuthService] 기존 SNS 사용자 발견:', {
          userId: existingUser.userId,
          email: existingUser.email,
          provider: existingUser.provider
        });
        await transaction.commit();
        return existingUser;
      }

      const userId = this.generateSNSUserId(provider, snsId);
      console.log('🆔 생성된 사용자 ID:', {
        userId,
        length: userId.length,
        maxAllowed: 255
      });

      const newUser = await User.create({
        userId,
        name,
        email,
        birth: new Date('2000-01-01'),
        provider,
        provider_id: snsId,
        password: crypto.randomBytes(16).toString('hex'),
        trial_start_at: new Date(),
      }, { transaction });

      await transaction.commit();

      console.log('✅ [OAuthService] 신규 SNS 사용자 생성 성공:', {
        userId: newUser.userId,
        email: newUser.email,
        provider: newUser.provider
      });

      return newUser;
    } catch (error) {
      await transaction.rollback();

      console.error('❌ [OAuthService] 사용자 생성/조회 실패:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        provider,
        snsId: snsId.length > 20 ? `${snsId.slice(0, 10)}...${snsId.slice(-5)}` : snsId,
        name,
        email
      });

      throw error;
    }
  }
}

export default new OAuthService();