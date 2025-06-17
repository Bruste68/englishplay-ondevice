// config/auth.ts
export const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
  JWT_EXPIRES_IN: '1d', // ✅ 반드시 이런 형식: "1d", "12h", "3600"
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