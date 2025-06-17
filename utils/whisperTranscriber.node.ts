import path from 'path';
import { ensureWhisperModelDownloaded } from './whisperModel';

const { whisper } = require(path.join(__dirname, '../../build/Release/addon.node'));
const { promisify } = require('util');

const whisperAsync = promisify(whisper);

export async function transcribeAudio(audioPath: string, language: string = 'en'): Promise<string> {
  try {
    const modelPath = await ensureWhisperModelDownloaded();

    const result = await whisperAsync({
      model: modelPath,
      fname_inp: audioPath,
      language,
      no_prints: true,
    });

    return result.text || '';
  } catch (err) {
    console.error('❌ Whisper 인식 실패:', err);
    return '';
  }
}
