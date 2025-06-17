import dotenv from 'dotenv';
import path from 'path';
import sequelize from './db';
import app from './app';

// ✅ 환경 변수 로딩 로그
console.log('📦 환경변수 로딩 중...');
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const PORT = process.env.PORT || 5000;
console.log('🔧 서버 시작 준비... 포트:', PORT);
console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? '[OK]' : '[MISSING]');
console.log('🛢️  DB_NAME:', process.env.DB_NAME);

// ✅ DB 연결 확인
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ DB 연결 성공!');
    return sequelize.sync(); // 테이블 동기화
  })
  .then(() => {
    console.log('✅ 모델 동기화 완료!');

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB 연결 또는 테이블 생성 실패:', err);
  });
