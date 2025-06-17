// src/scripts/sync.ts
import sequelize from '../db';

(async () => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('❌ production 환경에서는 sync.ts를 실행하지 않도록 설정되어 있습니다.');
    process.exit(1);
  }

  try {
    console.log('🔄 Sequelize 모델을 DB와 동기화합니다... (NODE_ENV:', process.env.NODE_ENV, ')');
    await sequelize.sync({ alter: true });
    console.log('✅ DB 동기화 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ DB 동기화 중 오류:', error);
    process.exit(1);
  }
})();
