// lib/api.ts
import axios from 'axios';

// ✅ 실제 운영 서버 주소로 고정
export const API_BASE_URL = 'https://samspeakgo.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

export default api;
