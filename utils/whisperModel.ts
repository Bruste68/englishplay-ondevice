import * as FileSystem from 'expo-file-system';

export async function ensureWhisperModelDownloaded(): Promise<string> {
  const modelDir = FileSystem.documentDirectory + 'whisper/';
  const modelPath = modelDir + 'ggml-base.en.bin';

  const fileInfo = await FileSystem.getInfoAsync(modelPath);
  if (!fileInfo.exists) {
    // 모델 다운로드 로직
    await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
    const remoteUrl = 'https://your-server.com/models/ggml-base.en.bin';

    const downloadResumable = FileSystem.createDownloadResumable(
      remoteUrl,
      modelPath
    );

    await downloadResumable.downloadAsync();
  }

  return modelPath;
}
