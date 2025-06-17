import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { TOPIC_TITLES } from '../../constants/topics';

const { width } = Dimensions.get('window');

export default function TopicSelectScreen() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // 🔐 로그인 여부 확인
  useEffect(() => {
    const checkLogin = async () => {
      const email = await AsyncStorage.getItem('currentUserEmail');
      if (!email) {
        router.replace('/login'); // 로그인 안 되어 있으면 로그인으로 이동
      } else {
        setIsLoggedIn(true);
      }
    };
    checkLogin();
  }, []);

  const handleSelect = (key: string) => {
    router.push({ pathname: '/ChatScreen', params: { topicKey: key } });
  };

  const goToLanguage = () => {
    router.push('/language');
  };

  const romanNumerals = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.'];
  const formattedTopics = Object.entries(TOPIC_TITLES).map(([key, title], index) => ({
    key,
    title: `${romanNumerals[index]}  ${title.replace('Bussiness', 'Business')}`,
  }));

  if (isLoggedIn === null) return null; // 아직 로그인 체크 중이면 화면 표시 안 함

  return (
    <View style={styles.container}>
      <Text style={styles.bookTitle}>- Contents -</Text>

      <ScrollView
        contentContainerStyle={styles.topicList}
        showsVerticalScrollIndicator={false}
      >
        {formattedTopics.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.topicRow}
            onPress={() => handleSelect(item.key)}
          >
            <Text style={styles.topicText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.footerButton} onPress={goToLanguage}>
        <View style={styles.footerButtonContent}>
          <Image
            source={require('../../assets/images/language.png')}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>Return to Language Selection</Text>
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
    paddingTop: 80,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 60,
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
    marginBottom: 30,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  footerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    width: 60,
    height: 50,
    marginRight: 10,
    resizeMode: 'contain',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
