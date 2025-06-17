import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Button,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLanguage } from '../../hooks/useLanguage';
import { useSocialLogin } from '../../hooks/useSocialLogin';

const getSNSOptions = (lang: string) => {
  switch (lang) {
    case 'ko':
      return [
        { id: 'google', icon: require('../../assets/icons/ko/google.png') },
        { id: 'kakao', icon: require('../../assets/icons/ko/kakao.png') },
        { id: 'naver', icon: require('../../assets/icons/ko/naver.png') },
        { id: 'facebook', icon: require('../../assets/icons/ko/facebook.png') },
      ];
    case 'zh':
      return [
        { id: 'wechat', icon: require('../../assets/icons/zh/wechat.png') },
        { id: 'alipay', icon: require('../../assets/icons/zh/alipay.png') },
      ];
    case 'ja':
      return [
        { id: 'google', icon: require('../../assets/icons/ja/google.png') },
        { id: 'apple', icon: require('../../assets/icons/ja/apple.png') },
        { id: 'line', icon: require('../../assets/icons/ja/line.png') },
        { id: 'yahoo', icon: require('../../assets/icons/ja/yahoo.png') },
      ];
    case 'vi':
      return [
        { id: 'google', icon: require('../../assets/icons/vi/google.png') },
        { id: 'facebook', icon: require('../../assets/icons/vi/facebook.png') },
        { id: 'line', icon: require('../../assets/icons/ja/line.png') },
      ];
    case 'en':
    default:
      return [
        { id: 'google', icon: require('../../assets/icons/en/google.png') },
        { id: 'facebook', icon: require('../../assets/icons/en/facebook.png') },
      ];
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { loginWithGoogle } = useSocialLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const snsOptions = useMemo(() => getSNSOptions(language), [language]);

  useEffect(() => {
    const configureGoogleSignIn = async () => {
      try {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        GoogleSignin.configure({
          webClientId: '925681825495-78b1e74h3oilhd3qtv4g5e746gda5hk1.apps.googleusercontent.com',
          iosClientId: 'YOUR_IOS_CLIENT_ID',
          offlineAccess: true,
        });
      } catch (err) {
        console.error('GoogleSignin 설정 실패:', err);
      }
    };
    configureGoogleSignIn();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t.alertTitle || 'Error', t.wrongPassword || 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${process.env.API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      if (rememberMe) {
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('savedPassword', password);
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
      }

      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(response.data.user));

      router.replace(
        response.data.user.trialExpired ? '/purchase' : '/screens/TopicSelectScreen'
      );
    } catch (error) {
      const err = error as any;
      Alert.alert(
        t.alertTitle || 'Error',
        err.response?.data?.message || t.loginFailed || 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const response = await axios.post(`${process.env.API_BASE_URL}/api/oauth/google`, {
        accessToken: userInfo.idToken,
        platform: 'android',
      });

      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(response.data.user));

      router.replace(
        response.data.user.trialExpired ? '/purchase' : '/screens/TopicSelectScreen'
      );
    } catch (error) {
      const err = error as any;
      console.error('Google login error:', err);
      Alert.alert(
        t.alertTitle || 'Error',
        err.response?.data?.message || t.loginFailed || 'Login failed. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleNaverLogin = async () => {
    try {
      Linking.openURL('https://samspeakgo.com/oauth/naver');
    } catch (error) {
      Alert.alert('오류', '네이버 로그인에 실패했습니다.');
    }
  };

  const handleYahooLogin = () => {
    Linking.openURL('https://samspeakgo.com/oauth/yahoo');
  };

  const handleLineLogin = () => {
    Linking.openURL('https://samspeakgo.com/oauth/line');
  };

  const handleFacebookLogin = () => {
    Linking.openURL('https://samspeakgo.com/oauth/facebook');
  };

  const handleSNSLogin = async (providerId: string) => {
    if (providerId === 'google') {
      await handleGoogleLogin();
    } else if (providerId === 'naver') {
      await handleNaverLogin();
    } else if (providerId === 'yahoo') {
      await handleYahooLogin();
    } else if (providerId === 'line') {
      handleLineLogin();
    } else if (providerId === 'facebook') {
      handleFacebookLogin();
    } else {
      Alert.alert('오류', `${providerId} 로그인이 아직 구현되지 않았습니다.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>🗣️ SamSpeak</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder={t.email || 'Email'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={t.password || 'Password'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.loginButtonText}>{t.login || 'Login'}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.linkRow}>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.linkText}>{t.signup || 'Sign Up'}</Text>
        </TouchableOpacity>
        <Text style={styles.linkDivider}>|</Text>
        <TouchableOpacity onPress={() => router.push('/forgot')}>
          <Text style={styles.linkText}>{t.forgot || 'Forgot Password?'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxRow}>
        <TouchableOpacity style={styles.checkbox} onPress={() => setRememberMe(!rememberMe)}>
          <View style={styles.checkboxBox}>
            {rememberMe && <View style={styles.checkboxChecked} />}
          </View>
          <Text style={styles.checkboxLabel}>아이디와 비밀번호 저장</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.snsContainer}>
        <Text style={styles.snsText}>{t.or || 'Or login with'}</Text>
        <View style={styles.snsRow}>
          {snsOptions.map((sns) => (
            <TouchableOpacity
              key={sns.id}
              style={styles.snsButton}
              onPress={() => handleSNSLogin(sns.id)}
              disabled={googleLoading && sns.id === 'google'}
            >
              {googleLoading && sns.id === 'google' ? (
                <ActivityIndicator size="small" />
              ) : (
                <Image source={sns.icon} style={styles.snsIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.footerButton} onPress={() => router.replace('/language')}>
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
    padding: 60,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoText: { fontSize: 28, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 },
  loginButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8 },
  loginButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  linkText: { color: '#007AFF', marginHorizontal: 6 },
  linkDivider: { color: '#999' },
  snsContainer: { marginTop: 32, alignItems: 'center' },
  snsText: { marginBottom: 8, color: '#444' },
  snsRow: { flexDirection: 'row', gap: 16 },
  snsButton: { padding: 10 },
  snsIcon: { width: 28, height: 28, resizeMode: 'contain' },
  footerButton: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  footerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  footerText: {
    fontSize: 14,
    color: '#555',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#999',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
});
