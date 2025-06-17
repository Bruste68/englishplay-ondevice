import 'dotenv/config';
import { withDangerousMod } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

const withGoogleServicesJson = config => {
  return withDangerousMod(config, [
    'android',
    async config => {
      const appPath = path.resolve('./android/app');
      const gsPath = path.join(appPath, 'google-services.json');

      if (!fs.existsSync(appPath)) {
        fs.mkdirSync(appPath, { recursive: true });
      }

      const base64 = process.env.GOOGLE_SERVICES_JSON;
      if (base64) {
        const buffer = Buffer.from(base64, 'base64');
        fs.writeFileSync(gsPath, buffer);
        console.log('✅ google-services.json created in withDangerousMod');
      } else {
        console.warn('⚠️ GOOGLE_SERVICES_JSON env variable not set');
      }

      return config;
    }
  ]);
};

export default ({ config }) => {
  config = withGoogleServicesJson(config);

  return {
    ...config,
    name: 'englishplay-ondevice',
    slug: 'englishplay-ondevice',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    runtimeVersion: {
      policy: 'sdkVersion'
    },
    assetBundlePatterns: ['**/*'],

    android: {
      package: 'com.bruste68.englishplayondevice.play',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      permissions: [],
      googleServicesFile: './android/app/google-services.json',
      buildProperties: {
        kotlinVersion: '1.8.22' // ✅ Kotlin 최적화 버전
      },
      runtimeVersion: {
        policy: 'sdkVersion'
      }
    },

    plugins: ['expo-dev-client'],

    extra: {
      eas: {
        projectId: '3c63c36b-05ee-41fb-aa8e-1d8c56077f3b'
      },
      API_BASE_URL: 'https://samspeakgo.com/api',

      // ✅ 공개/비공개 환경변수
      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      GOOGLE_ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID,
      GOOGLE_APP_REDIRECT_URI: process.env.GOOGLE_APP_REDIRECT_URI,

      NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID,
      NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET,
      NAVER_CALLBACK_URL: process.env.NAVER_CALLBACK_URL,

      FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
      FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
      FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL,

      YAHOO_CLIENT_ID: process.env.YAHOO_CLIENT_ID,
      YAHOO_CLIENT_SECRET: process.env.YAHOO_CLIENT_SECRET,
      YAHOO_CALLBACK_URL: process.env.YAHOO_CALLBACK_URL,

      LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID,
      LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
      LINE_CALLBACK_URL: process.env.LINE_CALLBACK_URL,

      KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY,
      KAKAO_REDIRECT_URI: process.env.KAKAO_REDIRECT_URI
    }
  };
};
