import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { GOOGLE_CONFIG, FACEBOOK_CONFIG } from '../config/oauth';
import api from '../api'; // API 클라이언트

GoogleSignin.configure(GOOGLE_CONFIG);

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const token = userInfo.idToken;
    
    // 서버에 토큰 전송
    const response = await api.post('/auth/google', { token });
    return response.data;
  } catch (error) {
    console.error('Google SignIn Error:', error);
    throw error;
  }
};

export const signInWithFacebook = async () => {
  try {
    const result = await LoginManager.logInWithPermissions(FACEBOOK_CONFIG.permissions);
    
    if (result.isCancelled) {
      throw new Error('User cancelled the login process');
    }

    const data = await AccessToken.getCurrentAccessToken();
    
    if (!data) {
      throw new Error('Something went wrong obtaining access token');
    }

    const response = await api.post('/auth/facebook', { token: data.accessToken });
    return response.data;
  } catch (error) {
    console.error('Facebook SignIn Error:', error);
    throw error;
  }
};