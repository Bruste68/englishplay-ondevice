import fs from 'fs';
import path from 'path';

export function getWhisperModelPath(): string {
  return path.resolve(__dirname, '../../models/ggml-tiny.bin');
}

export function getModelSize(): string {
  return 'tiny';
}

export function ensureWhisperModelDownloaded(): boolean {
  const modelPath = getWhisperModelPath();
  return fs.existsSync(modelPath);
}
