import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('모든 항목을 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await fetch('http://47.237.71.231:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('회원가입 실패', data.message || '이미 등록된 이메일입니다.');
        return;
      }

      await AsyncStorage.setItem('authToken', data.token);
      Alert.alert('회원가입 완료! 자동 로그인되었습니다.', '', [
        { text: '확인', onPress: () => router.replace('/screens/TopicSelectScreen') },
      ]);
    } catch (error) {
      console.error('❌ 회원가입 요청 실패:', error);
      Alert.alert('오류 발생', '서버와 연결할 수 없습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="이메일 입력"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호 입력"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호 확인"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>가입하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
});
