// Node.js 환경에서만 사용
import { ensureWhisperModelDownloaded } from './whisperModel';
import path from 'path';
const { whisper } = require(path.join(__dirname, '../../build/Release/addon.node'));
const { promisify } = require('util');

const whisperAsync = promisify(whisper);

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const modelPath = await ensureWhisperModelDownloaded();

    const result = await whisperAsync({
      model: modelPath,
      fname_inp: audioPath,
      language: 'en',
      no_prints: true,
    });

    console.log('📝 Whisper 결과:', result.text);
    return result.text || '';
  } catch (error) {
    console.error('❌ Whisper 오류:', error);
    return '';
  }
}
