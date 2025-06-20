import { initWhisper } from './whisperRunner.native';
import { ensureWhisperModel } from './ensureWhisperModel';

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const modelPath = await ensureWhisperModel(); // ✅ 자동 다운로드 또는 캐시된 경로
    const whisper = await initWhisper({ modelPath });

    const result = await whisper.transcribe({ audio: audioPath });

    if (!result || !result.text) {
      throw new Error('텍스트 결과가 비어 있습니다.');
    }

    console.log('📝 인식 결과:', result.text);
    return result.text;
  } catch (error) {
    console.error('❌ Whisper 변환 실패:', error);
    throw error;
  }
}
