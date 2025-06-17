import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAuth } from '../auth/AuthProvider';

const SocialLoginButtons = () => {
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await login('google');
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await login('facebook');
    } catch (error) {
      console.error('Facebook login error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.facebookButton]} onPress={handleFacebookLogin}>
        <Text style={styles.buttonText}>Sign in with Facebook</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 20,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SocialLoginButtons;