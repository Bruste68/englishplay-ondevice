// app/WhisperDownloadScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getRecommendedWhisperModel } from '../utils/checkDeviceSpec';

export default function WhisperDownloadScreen() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('모델 다운로드를 준비 중입니다...');
  const [isError, setIsError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [modelInfo, setModelInfo] = useState({
    name: 'small',
    url: '',
    path: '',
  });

  const startDownload = async () => {
    try {
      setIsError(false);
      setIsLoading(true);
      setProgress(0);
      setStatus('모델 다운로드 준비 중...');

      const recommended = await getRecommendedWhisperModel();
      const filename = `ggml-${recommended}.bin`;
      const url = `https://whisper-english-app.oss-ap-southeast-1.aliyuncs.com/${filename}`;
      const path = FileSystem.documentDirectory + filename;

      setModelInfo({ name: recommended, url, path });

      // ✅ 이미 존재할 경우
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists && info.size > 100 * 1024 * 1024) {
        setStatus('이미 다운로드됨. Whisper 준비 완료!');
        setIsReady(true);
        setIsLoading(false);
        return;
      }

      setStatus(`Whisper ${recommended} 모델 다운로드 중...`);

      const callback = FileSystem.createDownloadResumable(
        url,
        path,
        {},
        (downloadProgress) => {
          const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
          if (totalBytesExpectedToWrite > 0) {
            const percent = Math.floor((totalBytesWritten / totalBytesExpectedToWrite) * 100);
            setProgress(percent);
          } else {
            setProgress(0); // or keep it null
          }
        }
      );

      await callback.downloadAsync();
      setStatus('Whisper 준비 완료!');
      setIsReady(true);
    } catch (error) {
      console.error('❌ 모델 다운로드 실패:', error);
      setStatus('❌ 다운로드 실패. 인터넷 연결을 확인해주세요.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startDownload();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧠 Whisper 모델 다운로드</Text>
      <Text style={styles.status}>{status}</Text>

      {isLoading && (
        <>
          <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
          <Text style={styles.progress}>{progress}%</Text>
        </>
      )}

      {isError && <Button title="다시 시도" onPress={startDownload} color="#FF3B30" />}

      {isReady && (
        <Button
          title="시작하기"
          onPress={() => Alert.alert('완료', `${modelInfo.name} 모델 준비가 완료되었습니다!`)}
          color="#34C759"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  progress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
});
