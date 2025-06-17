// utils/whisperModel.ts
import * as FileSystem from 'expo-file-system';

export async function ensureWhisperModelDownloaded(): Promise<string> {
  const modelDir = FileSystem.documentDirectory + 'whisper/';
  const modelPath = modelDir + 'ggml-base.en.bin';

  const fileInfo = await FileSystem.getInfoAsync(modelPath);

  if (!fileInfo.exists) {
    console.log('⬇️ Whisper 모델 다운로드 시작...');
    await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });

    const remoteUrl = 'https://your-server.com/models/ggml-base.en.bin'; // 실제 서버 URL로 변경
    const downloadResumable = FileSystem.createDownloadResumable(remoteUrl, modelPath);

    await downloadResumable.downloadAsync();
    console.log('✅ Whisper 모델 다운로드 완료');
  } else {
    console.log('📦 Whisper 모델 이미 존재:', modelPath);
  }

  return modelPath;
}
