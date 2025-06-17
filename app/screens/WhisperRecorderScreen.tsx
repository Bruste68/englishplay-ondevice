// app/screens/WhisperRecorderScreen.tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import WhisperRecorder from '../../components/WhisperRecorder';

export default function WhisperRecorderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 Whisper STT 테스트</Text>
      <WhisperRecorder />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
});
