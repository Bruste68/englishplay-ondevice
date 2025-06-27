import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { TOPIC_TITLES } from '../../constants/topics';

const { width } = Dimensions.get('window');

// 체험일수 계산 (기본 3일 체험)
function calculateTrialDaysLeft(startStr?: string): string {
  if (!startStr) return '-'; // NULL 또는 없으면 처리 불가
  const start = new Date(startStr);
  if (isNaN(start.getTime())) {
    console.error('❌ Invalid trial start date:', startStr);
    return '-';
  }

  const end = new Date(start.getTime() + 3 * 86400000); // 3일 후
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  console.log(`trialStart: ${start}, trialEnd: ${end}, diffDays: ${diffDays}`);
  return diffDays > 0 ? `${diffDays}일` : '만료';
}

// 프리미엄 남은 일수 계산 (1개월, 6개월, 1년)
function calculatePremiumDaysLeft(endStr?: string): string {
  if (!endStr) return '-'; // NULL 처리
  const end = new Date(endStr);
  if (isNaN(end.getTime())) {
    console.error('❌ Invalid premium expiry date:', endStr);
    return '-';
  }

  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  console.log(`premiumEnd: ${end}, diffDays: ${diffDays}`);
  if (diffDays <= 0) return '만료';

  if (diffDays <= 31) return `${diffDays}일 (1개월권)`;
  if (diffDays <= 186) return `${diffDays}일 (6개월권)`;
  return `${diffDays}일 (1년권)`;
}

export default function TopicSelectScreen() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<string>('-');
  const [premiumDaysLeft, setPremiumDaysLeft] = useState<string>('-');
  const [isTrial, setIsTrial] = useState<boolean>(false);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const userStr = await AsyncStorage.getItem('currentUser');
      if (!token || !userStr) {
        router.replace('/login');
      } else {
        const user = JSON.parse(userStr);
        setIsTrial(user.premium_expires_at ? false : true); // 체험기간 확인
        const trialLeft = calculateTrialDaysLeft(user.trial_start_at);
        const premiumLeft = calculatePremiumDaysLeft(user.premium_expires_at);
        console.log('Trial Left:', trialLeft); // 디버깅: 체험일 계산 확인
        console.log('Premium Left:', premiumLeft); // 디버깅: 사용일 계산 확인
        setTrialDaysLeft(trialLeft);
        setPremiumDaysLeft(premiumLeft);
        setIsLoggedIn(true);
      }
    };
    checkLogin();
  }, []);

  const handleSelect = (key: string) => {
    router.push({ pathname: '/ChatScreen', params: { topicKey: key } });
  };

  const goToLogin = () => {
    router.push('/login');
  };

  const romanNumerals = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.'];
  const formattedTopics = Object.entries(TOPIC_TITLES).map(([key, title], index) => ({
    key,
    title: `${romanNumerals[index]}  ${title.replace('Bussiness', 'Business')}`,
  }));

  if (isLoggedIn === null) return null;

  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        <Text style={styles.dateTextLeft}>
          {isTrial ? `잔여체험일: ${trialDaysLeft}` : `잔여사용일수: ${premiumDaysLeft}`}
        </Text>
        <Text style={styles.dateTextRight}>
          {!isTrial && `잔여사용일수: ${premiumDaysLeft}`}
        </Text>
      </View>

      <Text style={styles.bookTitle}>- Contents -</Text>

      <ScrollView contentContainerStyle={styles.topicList} showsVerticalScrollIndicator={false}>
        {formattedTopics.map((item) => (
          <TouchableOpacity key={item.key} style={styles.topicRow} onPress={() => handleSelect(item.key)}>
            <Text style={styles.topicText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.footerButton} onPress={goToLogin}>
        <View style={styles.footerButtonContent}>
          <Text style={styles.footerText}>Back to Login</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf8f3',
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dateTextLeft: {
    fontSize: 13,
    color: '#444',
  },
  dateTextRight: {
    fontSize: 13,
    color: '#444',
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 50,
  },
  topicList: {
    paddingBottom: 20,
  },
  topicRow: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  topicText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e2e2e',
  },
  footerButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  footerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
