// ✅ whisperModel.ts
import path from 'path';

export function getWhisperModelPath(): string {
  // 기본으로 사용할 Whisper Tiny 모델 경로
  return path.resolve(__dirname, '../../models/ggml-tiny.bin');
}

export function getModelSize(): string {
  // 현재 모델 타입 리턴
  return 'tiny';
}
