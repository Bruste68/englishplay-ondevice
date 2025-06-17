// src/db.ts
import User from './models/user.model'; // ✅ 모델 import
import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

console.log('🛠️ [db.ts] 파일 로딩 시작됨');

// ✅ .env 경로 명시 및 로딩
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// ✅ 환경 변수 확인
console.log('\n🔎 [환경변수 확인]');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '(존재함)' : '(없음)');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('NODE_ENV:', process.env.NODE_ENV);

// ✅ mysql2 연결 테스트
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log('✅ mysql2 직접 연결 성공');
    await conn.end();
  } catch (err) {
    console.error('❌ mysql2 직접 연결 실패:', err);
  }
})();

// ✅ Sequelize 인스턴스 생성
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: console.log,
  dialectOptions: {
    connectTimeout: 60000,
  },
  retry: {
    max: 5,
    match: [/ETIMEDOUT/, /ECONNREFUSED/, /ECONNRESET/, /EHOSTUNREACH/, /ESOCKETTIMEDOUT/, /SequelizeConnection/],
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// ✅ 연결 확인 및 스키마 동기화
(async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ [${process.env.NODE_ENV}] DB 연결 확인 완료`);

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 개발 환경 - DB 스키마 동기화 시도');
      await sequelize.sync({ alter: true });
      console.log('✅ DB 스키마 동기화 완료');
    } else {
      console.log('🚫 프로덕션 환경 - DB 스키마 동기화는 수행하지 않음');
    }
  } catch (err) {
    console.error('❌ DB 연결/동기화 실패:', err);
  }
})();

export default sequelize;
