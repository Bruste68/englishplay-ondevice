// services/authApi.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://samspeakgo.com/api'; // ✅ 서버 주소

export async function login(userId: string, name: string, birth: string) {
  try {
    const response = await axios.post(`${API_BASE}/login`, {
      userId,
      name,
      birth,
    });

    const { token } = response.data;

    // JWT 토큰 저장 (로그인 유지용)
    await AsyncStorage.setItem('accessToken', token);

    return { success: true };
  } catch (err: any) {
    console.error('로그인 실패:', err.response?.data || err.message);
    return { success: false, message: err.response?.data?.message || '로그인 실패' };
  }
}

export async function logout() {
  await AsyncStorage.removeItem('accessToken');
}

export async function getStoredToken(): Promise<string | null> {
  return await AsyncStorage.getItem('accessToken');
}
