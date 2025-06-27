import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage, translations, LanguageCode } from '../hooks/useLanguage';
import { Image } from 'react-native';

const languages: { code: LanguageCode; label: string; emoji: string }[] = [
  { code: 'en', label: 'English', emoji: '🇺🇸' },
  { code: 'ko', label: '한국어', emoji: '🇰🇷' },
  { code: 'zh', label: '中文', emoji: '🇨🇳' },
  { code: 'ja', label: '日本語', emoji: '🇯🇵' },
  { code: 'vi', label: 'Tiếng Việt', emoji: '🇻🇳' },
];

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { setLanguage, t, isReady } = useLanguage();

  const checkTrialExpired = async (): Promise<boolean> => {
    const startDate = await AsyncStorage.getItem('trialStartDate');
    if (startDate) {
      const start = new Date(startDate);
      const now = new Date();
      const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 60;
    }
    return false;
  };  

  const goToLogin = () => {
    router.push('/login');
  };

  useEffect(() => {
    const initTrialDateIfNotExists = async () => {
      const existing = await AsyncStorage.getItem('trialStartDate');
      if (!existing) {
        const now = new Date().toISOString();
        await AsyncStorage.setItem('trialStartDate', now);
        console.log('📆 trialStartDate 초기화됨:', now);
      } else {
        console.log('📆 기존 trialStartDate:', existing);
      }
    };

    initTrialDateIfNotExists();
  }, []);

  const selectLanguage = async (code: string) => {
    try {
      console.log('📌 언어 선택됨:', code);

      const langCode = code as LanguageCode;
      await setLanguage(langCode);
      console.log('✅ 언어 상태 업데이트 완료');

      const tByCode = translations[langCode as keyof typeof translations];
      if (!tByCode) throw new Error(`translations[${code}] is undefined`);

      const isExpired = await checkTrialExpired();
      console.log('⏰ 체험 만료 상태:', isExpired);

      if (isExpired) {
        console.log('⚠️ Alert 실행 시도');
        Alert.alert(
          tByCode.trialExpiredTitle,
          tByCode.trialExpiredMessage,
          [
            {
              text: tByCode.cancelPurchase,
              onPress: () => {
                console.log('❌ 구매 취소 클릭됨');
                router.replace('/language');
              },
              style: 'cancel',
            },
            {
              text: tByCode.purchaseNow,
              onPress: () => {
                console.log('💳 구매 시도 클릭됨');

                if (code.startsWith('zh')) {
                  router.push('/purchase/china');
                } else {
                  router.push('/purchase');
                }
              },
            },
          ]
        );
      } else {
        console.log('➡️ 체험중 - 로그인 화면으로 이동');
        router.replace('/login');
      }
    } catch (error) {
      console.error('Language selection error:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Image
            source={require('../assets/images/logo.png')}
            style={{ width: 80, height: 80, resizeMode: 'contain' }}
          />
          <Text style={styles.title}> SamSpeak </Text>

          {languages.map(({ code, label, emoji }) => (
            <TouchableOpacity
              key={code}
              style={styles.cardButton}
              onPress={() => selectLanguage(code)}
            >
              <Text style={styles.cardText}>{emoji} {label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    backgroundColor: '#fdfaf5',
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3e3e3e',
    marginBottom: 80,
  },
  cardButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginVertical: 10,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  footerButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerButtonContent: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  footerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
