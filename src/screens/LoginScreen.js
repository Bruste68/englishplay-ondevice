import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import SocialLoginButtons from '../components/SocialLoginButtons';
import { useAuth } from '../auth/AuthProvider';

const LoginScreen = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <SocialLoginButtons />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 30,
  },
});

export default LoginScreen;