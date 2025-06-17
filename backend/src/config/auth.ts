// config/auth.ts

import dotenv from 'dotenv';
dotenv.config();


function ensure<T>(value: T | undefined, key: string): T {
  if (!value) {
    throw new Error(`❌ 환경변수 ${key} 가 설정되지 않았습니다.`);
  }
  return value;
}

// 명시적으로 타입 단언
export const AUTH_CONFIG = {
  JWT_SECRET: ensure(process.env.JWT_SECRET, 'JWT_SECRET'),
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN ?? '1d') as string, // 👈 string으로 강제
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS || '10', 10),
};

export const GOOGLE_CONFIG = {
  WEB: {
    CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_WEB_CLIENT_SECRET,
    REDIRECT_URI: process.env.GOOGLE_WEB_REDIRECT_URI,
  },
  ANDROID: {
    CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID,
    REDIRECT_URI: process.env.GOOGLE_APP_REDIRECT_URI,
  },
  EXPO: {
    CLIENT_ID: process.env.GOOGLE_EXPO_CLIENT_ID,
    REDIRECT_URI: process.env.GOOGLE_APP_REDIRECT_URI,
  },
};
