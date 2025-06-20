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
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function TopicSelectScreen() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const user = await AsyncStorage.getItem('currentUser');
      if (!token || !user) {
        router.replace('/login');
      } else {
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

  const goToWhisperTest = () => {
    router.push('/screens/WhisperRecorderScreen');
  };

  const romanNumerals = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.'];
  const formattedTopics = Object.entries(TOPIC_TITLES).map(([key, title], index) => ({
    key,
    title: `${romanNumerals[index]}  ${title.replace('Bussiness', 'Business')}`,
  }));

  if (isLoggedIn === null) return null;

  return (
    <View style={styles.container}>
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

      {/* ✅ 개발 모드에서만 보이도록 조건부 렌더링 */}
      {__DEV__ && (
        <TouchableOpacity style={styles.testButton} onPress={goToWhisperTest}>
          <FontAwesome5 name="microphone-alt" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.testButtonText}>🎤 Whisper STT 테스트</Text>
        </TouchableOpacity>
      )}
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
  footerIcon: {
    width: 60,
    height: 50,
    marginRight: 10,
    resizeMode: 'contain',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
