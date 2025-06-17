import * as FileSystem from 'expo-file-system';
import { OPENAI_API_KEY } from '../constants/secrets';

export async function transcribeAudio(uri: string, language: string = 'en'): Promise<string> {
  try {
    console.log('📤 [WHISPER] Uploading audio for transcription:', uri);
    const fileBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'audio.wav',
      type: 'audio/wav',
    } as any);
    formData.append('model', 'whisper-1');
    formData.append('language', language);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok && result.text) {
      return result.text;
    } else {
      console.error('🔴 [WHISPER ERROR]', result);
      return '';
    }
  } catch (err) {
    console.error('🔴 [WHISPER EXCEPTION]', err);
    return '';
  }
}
