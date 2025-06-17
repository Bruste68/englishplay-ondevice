import path from 'path';
const { whisper } = require(path.join(__dirname, '../../build/Release/addon.node'));
const { promisify } = require('util');

const whisperAsync = promisify(whisper);

export async function transcribeAudio(audioPath: string): Promise<string> {
  const result = await whisperAsync({
    model: path.resolve(__dirname, '../../models/ggml-base.en.bin'),
    fname_inp: audioPath,
    language: 'en',
    no_prints: true,
  });

  return result?.text || '';
}
