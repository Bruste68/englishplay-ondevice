// lib/api.ts
import axios from 'axios';

// ✅ 실제 운영 서버 주소로 고정
// export const API_BASE_URL = 'https://samspeakgo.com';
// export const API_BASE_URL = 'http://47.237.71.231:5000'; 
// export const API_BASE_URL = 'http://localhost:5000';
export const API_BASE_URL = 'https://9e4e-120-229-203-178.ngrok-free.app'; // ngrok URL


const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

export default api;
