import * as Whisper from 'react-native-whisper';
import { ensureWhisperModel } from './ensureWhisperModel';

let whisperInstance: typeof Whisper | null = null;

interface InitWhisperOptions {
  modelPath?: string;
}

export async function initWhisper(options: InitWhisperOptions = {}): Promise<typeof Whisper> {
  if (whisperInstance) return whisperInstance;

  const modelPath = options.modelPath || await ensureWhisperModel(); // ✅ loadModel → ensureWhisperModel로 변경
  console.log('📦 Whisper 모델 경로:', modelPath);

  try {
    await Whisper.loadModel(modelPath);
    console.log('✅ Whisper 모델 로드 완료');
    whisperInstance = Whisper;
    return whisperInstance;
  } catch (err) {
    console.error('❌ Whisper 모델 초기화 실패:', err);
    throw err;
  }
}
