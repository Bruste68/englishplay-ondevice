import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import axios from 'axios';

export const useSocialLogin = () => {
  const [loading, setLoading] = useState(false);

  const initGoogleSignin = useCallback(async () => {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      webClientId: '925681825495-78b1e74h3oilhd3qtv4g5e746gda5hk1.apps.googleusercontent.com',
      androidClientId: '925681825495-v900v134g50u5dpd3rqvts8is3m9ifkl.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const { GoogleSignin, statusCodes } = await import('@react-native-google-signin/google-signin');
      await initGoogleSignin();

      // 1. Google Play 서비스 확인
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // 2. Google 로그인 수행
      const { idToken, user } = await GoogleSignin.signIn();

      if (!idToken) {
        throw new Error('Google 로그인 실패: 토큰이 없습니다');
      }

      // 3. 백엔드에 토큰 전송
      const response = await axios.post('https://samspeakgo.com/api/oauth/google', {
        accessToken: idToken,
        platform: 'android'
      });

      // 4. 응답 처리
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(response.data.user));

      return response.data;
    } catch (error: any) {
      console.error('Google login error:', error);

      const { statusCodes } = await import('@react-native-google-signin/google-signin');
      let errorMessage = 'Google 로그인 실패';

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = '로그인이 취소되었습니다';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = '이미 로그인 진행 중입니다';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Google Play 서비스를 사용할 수 없습니다';
      }

      Alert.alert('오류', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loginWithGoogle,
    loading,
  };
};
