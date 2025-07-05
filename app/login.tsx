// login.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../lib/api';
import { useLanguage } from '../hooks/useLanguage';

console.log('백엔드 주소:', process.env.EXPO_PUBLIC_BACKEND_URL);

export default function LoginScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const init = async () => {
      const savedId = await AsyncStorage.getItem('rememberedUserId');
      if (savedId) {
        setUserId(savedId);
        setRememberMe(true);
      }
    };
    init();
  }, []);

  const localizedText = {
    trialExpiredTitle: {
      ko: '체험 또는 이용권 만료',
      en: 'Trial or subscription expired',
      zh: '试用或订阅已过期',
      ja: '体験または利用期間が終了しました',
      vi: 'Hết hạn dùng thử hoặc gói dịch vụ',
    },
    premiumExpiredMessage: {
      ko: '사용 기간이 만료되었습니다. 프리미엄 결제를 통해 계속 이용할 수 있습니다.',
      en: 'Your access has expired. Please purchase premium to continue.',
      zh: '使用期限已过，请购买高级服务以继续使用。',
      ja: '利用期間が終了しました。引き続き利用するにはプレミアムをご購入ください。',
      vi: 'Thời gian sử dụng đã hết. Vui lòng mua gói Premium để tiếp tục.',
    },
    purchaseNow: {
      ko: '지금 구매',
      en: 'Purchase Now',
      zh: '立即购买',
      ja: '今すぐ購入',
      vi: 'Mua ngay',
    },
    cancelPurchase: {
      ko: '취소',
      en: 'Cancel',
      zh: '取消',
      ja: 'キャンセル',
      vi: 'Hủy',
    },
    visitWebsite: {
      ko: '사용법은 http://samspeakgo.com에 들어가서 확인하세요',
      en: 'Visit http://samspeakgo.com for instructions',
      zh: '请访问 http://samspeakgo.com 查看使用方法',
      ja: '使い方は http://samspeakgo.com をご覧ください',
      vi: 'Truy cập http://samspeakgo.com để xem hướng dẫn sử dụng',
    },
  };

  const getLocalized = (obj) => obj[language] || obj['en'];

  const handleLogin = async () => {
    if (!userId.trim()) {
      Alert.alert(t.error, t.enterId);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username: userId.trim(),
      });

      const { token, user } = response.data;

      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      await AsyncStorage.setItem('language', language);
      await AsyncStorage.setItem('preferredLang', user.language || language);

      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUserId', userId.trim());
      } else {
        await AsyncStorage.removeItem('rememberedUserId');
      }

      // 무료 체험 시작일 처리
      let trialStartDate = await AsyncStorage.getItem('trialStartDate');
      if (!trialStartDate) {
        const now = new Date().toISOString();
        await AsyncStorage.setItem('trialStartDate', now);
        trialStartDate = now;
      }

      const trialStart = new Date(user.trialStartAt);
      const now = new Date();
      const daysSinceTrial = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);
      const trialExpired = daysSinceTrial > 3;

      // ✅ premium 만료 체크도 Invalid Date 방지
      let isPremium = false;
      let daysLeftPremium = 0;

      if (user.premiumExpiresAt) {
        const premiumExpiresAt = new Date(user.premiumExpiresAt);
        if (!isNaN(premiumExpiresAt.getTime())) {
          daysLeftPremium = (premiumExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          isPremium = premiumExpiresAt > now;
        }
      }

      const isMonthly = daysLeftPremium > 0 && daysLeftPremium <= 92;
      const isHalfYear = daysLeftPremium > 92 && daysLeftPremium <= 186;
      const isYearly = daysLeftPremium > 186;

      if (isPremium || !trialExpired) {
        console.log(`✅ 유효한 이용권: ${
          isMonthly ? '3개월' : isHalfYear ? '6개월' : isYearly ? '1년' : '기타'
        } 남음`);
        router.replace('/screens/TopicSelectScreen');
      } else {
        Alert.alert(
          getLocalized(localizedText.trialExpiredTitle),
          getLocalized(localizedText.premiumExpiredMessage),
          [
            { text: getLocalized(localizedText.cancelPurchase), style: 'cancel' },
            {
              text: getLocalized(localizedText.purchaseNow),
              onPress: () => router.replace('/purchase'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ 로그인 실패:', error.message);
      Alert.alert(t.loginFailed, error.response?.data?.message || t.tryAgain);
    } finally {
      setIsLoading(false);
    }
  };

  const goToLanguage = () => router.push('/language');

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
      </View>
      <Text style={styles.title}> SamSpeak </Text>

      <TextInput
        style={styles.input}
        placeholder={t.enterId}
        value={userId}
        onChangeText={setUserId}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.loginButtonText}>{t.login}</Text>}
      </TouchableOpacity>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          onPress={() => setRememberMe(!rememberMe)}
          style={styles.checkbox}
        >
          {rememberMe && <Text style={styles.checkboxMark}>✔</Text>}
        </TouchableOpacity>
        <Text onPress={() => setRememberMe(!rememberMe)} style={styles.checkboxLabel}>
          {t.rememberId || '아이디 기억하기'}
        </Text>
      </View>

      <Text style={styles.causion}>{getLocalized(localizedText.visitWebsite)}</Text>
      <Text style={styles.phrase}> Just do it! </Text>
      <Text style={styles.phrase}> You can make it! </Text>

      <TouchableOpacity style={styles.footerButton} onPress={goToLanguage}>
        <View style={styles.footerButtonContent}>
          <Text style={styles.footerText}>← {t.backToLanguage || 'Back'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, justifyContent: 'center', backgroundColor: '#fff' },
  logoContainer: { justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  logo: { width: 100, height: 100, resizeMode: 'contain' },
  title: { fontSize: 36, fontWeight: 'bold', color: '#3e3e3e', marginBottom: 80, textAlign: 'center' },
  phrase: { fontSize: 23, fontWeight: 'bold', color: '#3e3e3e', marginBottom: 5, textAlign: 'center' },
  causion: { fontSize: 16, fontWeight: 'bold', color: '#3e3e3e', marginBottom: 35, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 30 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 60 },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 1, borderColor: '#ccc', marginRight: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxMark: { color: '#007AFF', fontWeight: 'bold' },
  checkboxLabel: { fontSize: 16, color: '#333' },
  loginButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, marginBottom: 20 },
  loginButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  footerButton: {
    backgroundColor: '#ddd',          // ✅ 연한 회색
    paddingVertical: 8,               // ✅ 컴팩트한 높이
    paddingHorizontal: 12,            // ✅ 좌우 여백도 축소
    borderRadius: 6,
    alignSelf: 'flex-end',            // ✅ 오른쪽 정렬
    marginTop: 40,                    // ✅ 위와의 간격만 살짝
  },
  footerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: '#333',                    // ✅ 글자색도 회색 계열
    fontSize: 14,
    fontWeight: 'bold',
  },
});
