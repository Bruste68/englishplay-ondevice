import { useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot } from 'expo-router';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake'; 

// 다국어 안내 메시지
const whisperMessage = {
  en: {
    title: 'Whisper access restricted',
    message: 'Your Whisper usage period has expired.\nPlease log in again or renew your subscription.',
  },
  ko: {
    title: 'Whisper 사용 제한',
    message: 'Whisper 기능 사용 기간이 만료되었습니다.\n재로그인 또는 구독 갱신이 필요합니다.',
  },
  zh: {
    title: 'Whisper 使用受限',
    message: '您的 Whisper 使用期限已过。\n请重新登录或续订。',
  },
  ja: {
    title: 'Whisper の使用制限',
    message: 'Whisper の使用期間が終了しました。\n再ログインまたは購読の更新を行ってください。',
  },
  vi: {
    title: 'Hạn chế sử dụng Whisper',
    message: 'Thời gian sử dụng Whisper của bạn đã hết hạn.\nVui lòng đăng nhập lại hoặc gia hạn gói dịch vụ.',
  },
};

export default function App() {

  useEffect(() => {
    activateKeepAwake('samspeak');
    return () => {
      deactivateKeepAwake('samspeak');
    };
  }, []);

  useEffect(() => {
    (async () => {
      // ✅ 설치일 저장 (최초 1회)
      const saved = await AsyncStorage.getItem('appInstalledAt');
      if (!saved) {
        const now = new Date().toISOString();
        await AsyncStorage.setItem('appInstalledAt', now);
        console.log('📆 설치일 저장됨:', now);
      } else {
        console.log('📆 기존 설치일:', saved);
      }

      // ✅ Whisper 권한 체크 후 안내
      const canUse = await AsyncStorage.getItem('canUseWhisper');
      if (canUse === 'false') {
        const lang = (await AsyncStorage.getItem('language')) || 'en';
        const msg = whisperMessage[lang as keyof typeof whisperMessage] || whisperMessage['en'];
        Alert.alert(msg.title, msg.message);
      }
    })();
  }, []);

  return <Slot />; // ✅ expo-router 진입점
}
