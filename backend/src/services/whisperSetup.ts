import * as FileSystem from 'expo-file-system';

const MODEL_NAME = 'ggml-model-whisper-small.bin';
const MODEL_URL = `https://samspeakgo.com/models/${MODEL_NAME}`;
const MODEL_DIR = `${FileSystem.documentDirectory}whisper/`;
const MODEL_PATH = `${MODEL_DIR}${MODEL_NAME}`;

export async function ensureWhisperModel(): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(MODEL_PATH);

    if (fileInfo.exists) {
      console.log('✅ Whisper 모델 이미 존재함:', MODEL_PATH);
      return true;
    }

    console.log('⬇️ Whisper 모델 다운로드 시작...');
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });

    const downloadResumable = FileSystem.createDownloadResumable(
      MODEL_URL,
      MODEL_PATH
    );

    await downloadResumable.downloadAsync();
    console.log('✅ Whisper 모델 다운로드 완료');
    return true;
  } catch (err) {
    console.error('❌ Whisper 모델 다운로드 실패:', err);
    return false;
  }
}

export function getWhisperModelPath(): string {
  return MODEL_PATH;
}
