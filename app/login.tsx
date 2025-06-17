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

      const existingTrial = await AsyncStorage.getItem('trialStartDate');
      if (!existingTrial) {
        const now = new Date().toISOString();
        await AsyncStorage.setItem('trialStartDate', now);
        console.log('📆 trialStartDate 초기화됨:', now);
      } else {
        console.log('📆 기존 trialStartDate:', existingTrial);
      }
    };
    init();
  }, []);

  const isTrialExpired = async (): Promise<boolean> => {
    const startDate = await AsyncStorage.getItem('trialStartDate');
    if (!startDate) return false;
    const start = new Date(startDate);
    const now = new Date();
    const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 3;
  };

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

      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUserId', userId.trim());
      } else {
        await AsyncStorage.removeItem('rememberedUserId');
      }

      const now = new Date();
      const premiumExpiresAt = new Date(user.premiumExpiresAt);
      const isPremium = premiumExpiresAt > now;
      const trialExpired = await isTrialExpired();

      // ✅ 조건 분기 처리
      if (isPremium) {
        // 조건 ③: 프리미엄 사용자는 바로 주제 선택 화면
        router.replace('/screens/TopicSelectScreen');
      } else if (!trialExpired) {
        // 조건 ①: 체험 중인 사용자도 사용 가능
        router.replace('/screens/TopicSelectScreen');
      } else {
        // 조건 ②: 체험 종료 + 비구매자
        Alert.alert(
          t.trialExpiredTitle || '체험이 종료되었습니다',
          t.trialExpiredMessage || '프리미엄 구매를 통해 전체 기능을 이용하실 수 있습니다.',
          [
            { text: t.cancelPurchase || '취소', style: 'cancel' },
            {
              text: t.purchaseNow || '지금 구매',
              onPress: () => router.replace('/purchase'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ 로그인 실패:', error.message);
      Alert.alert(
        t.loginFailed,
        error.response?.data?.message || t.tryAgain,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goToLanguage = () => router.push('/language');

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />
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

      <Text style={styles.phrase}> Just do it! </Text>
      <Text style={styles.phrase}> You can make it! </Text>
      <TouchableOpacity style={styles.footerButton} onPress={goToLanguage}>
        <View style={styles.footerButtonContent}>
          <Text style={styles.footerText}>← {t.backToLanguage || 'Back to Language'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, justifyContent: 'center', backgroundColor: '#fff' },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3e3e3e',
    marginBottom: 80,
    textAlign: 'center',
  },
  phrase: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#3e3e3e',
    marginBottom: 5,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxMark: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footerButton: { marginTop: 60, backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  footerButtonContent: {},
  footerText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
