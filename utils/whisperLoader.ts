import * as FileSystem from 'expo-file-system';

const WHISPER_MODEL_URL = 'https://whisper-english-app.oss-ap-southeast-1.aliyuncs.com/ggml-small.bin';
const WHISPER_MODEL_PATH = FileSystem.documentDirectory + 'ggml-small.bin';

export async function ensureWhisperModel(): Promise<string> {
  const fileInfo = await FileSystem.getInfoAsync(WHISPER_MODEL_PATH);

  if (!fileInfo.exists) {
    console.log('📥 Whisper 모델 다운로드 시작...');
    const download = await FileSystem.downloadAsync(WHISPER_MODEL_URL, WHISPER_MODEL_PATH);
    console.log('✅ Whisper 모델 다운로드 완료:', download.uri);
  } else {
    console.log('📦 Whisper 모델 이미 존재:', WHISPER_MODEL_PATH);
  }

  return WHISPER_MODEL_PATH;
}
