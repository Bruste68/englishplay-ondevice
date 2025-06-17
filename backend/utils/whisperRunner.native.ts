import Whisper from 'react-native-whisper';
import { ensureWhisperModelDownloaded } from './whisperModel';

export async function transcribeAudio(audioPath: string): Promise<string> {
  const modelPath = await ensureWhisperModelDownloaded();

  const result = await (Whisper as any).start?.({
    modelPath,
    audioPath,
    language: 'en',
  });

  return result?.text || '';
}
