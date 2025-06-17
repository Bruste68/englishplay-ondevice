// app/index.tsx
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ 테스트용: 언어 설정 초기화
    AsyncStorage.removeItem('appLanguage');
    const checkLanguage = async () => {
      const lang = await AsyncStorage.getItem('appLanguage');
      if (!lang) {
        console.log('🚀 이동: /language');
        router.replace('/language');
      } else {
        console.log('✅ 저장된 언어:', lang);
        router.replace('/screens/TopicSelectScreen');
      }
    };
    checkLanguage().finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{loading ? '로딩 중...' : '언어 설정 확인 완료'}</Text>
    </View>
  );
}
