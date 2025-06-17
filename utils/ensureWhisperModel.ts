import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import { Alert } from 'react-native';

const WHISPER_MODEL_URL =
  'https://whisper-english-app.oss-ap-southeast-1.aliyuncs.com/ggml-small.bin';
const WHISPER_MODEL_PATH = FileSystem.documentDirectory + 'ggml-small.bin';

export interface WhisperDownloadOptions {
  onProgress?: (percent: number) => void;
  onStatus?: (text: string) => void;
}

/**
 * Whisper 모델이 존재하지 않으면 다운로드하고, 경로를 반환합니다.
 * Wi-Fi가 아닐 경우 사용자에게 경고를 표시합니다.
 */
export async function ensureWhisperModel(
  options?: WhisperDownloadOptions
): Promise<string> {
  const { onProgress, onStatus } = options || {};

  const fileInfo = await FileSystem.getInfoAsync(WHISPER_MODEL_PATH);

  if (fileInfo.exists) {
    console.log('📦 Whisper 모델 이미 존재:', WHISPER_MODEL_PATH);
    onStatus?.('모델이 이미 설치되어 있습니다.');
    onProgress?.(100);
    return WHISPER_MODEL_PATH;
  }

  const net = await Network.getNetworkStateAsync();
  const isWifi = net.isConnected && net.type === Network.NetworkStateType.WIFI;

  // Wi-Fi가 아니면 사용자에게 경고
  if (!isWifi) {
    const userConfirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        '네트워크 확인',
        '현재 Wi-Fi가 아닙니다. Whisper 모델(약 466MB)을 다운로드하면 데이터 요금이 발생할 수 있습니다. 계속하시겠습니까?',
        [
          { text: '취소', style: 'cancel', onPress: () => resolve(false) },
          { text: '계속', onPress: () => resolve(true) },
        ]
      );
    });

    if (!userConfirmed) {
      throw new Error('사용자가 다운로드를 취소했습니다.');
    }
  }

  console.log('📥 Whisper 모델 다운로드 시작...');
  onStatus?.('학습을 위한 프로그램을 다운로드 중입니다. 인터넷 없이 사용 가능하도록 준비하고 있어요.');
  onProgress?.(0);

  return new Promise((resolve, reject) => {
    const downloadResumable = FileSystem.createDownloadResumable(
      WHISPER_MODEL_URL,
      WHISPER_MODEL_PATH,
      {},
      (downloadProgress) => {
        const total = downloadProgress.totalBytesExpectedToWrite;
        const written = downloadProgress.totalBytesWritten;
        const progress = total > 0 ? written / total : 0;
        const percent = Math.floor(progress * 100);
        onProgress?.(percent);
      }
    );

    downloadResumable
      .downloadAsync()
      .then((res) => {
        console.log('✅ Whisper 모델 다운로드 완료:', res?.uri);
        onStatus?.('다운로드 완료. Whisper가 준비되었습니다.');
        resolve(res?.uri ?? WHISPER_MODEL_PATH);
      })
      .catch((err) => {
        console.error('❌ Whisper 모델 다운로드 실패:', err.message);
        FileSystem.deleteAsync(WHISPER_MODEL_PATH, { idempotent: true });
        onStatus?.('모델 다운로드에 실패했습니다. 다시 시도해주세요.');
        reject(err);
      });
  });
}

export { WHISPER_MODEL_PATH };
