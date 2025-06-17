// utils/checkDeviceSpec.ts
import * as Device from 'expo-device';

export type WhisperModelType = 'tiny' | 'small' | 'base';

/**
 * 기기 사양을 바탕으로 적절한 Whisper 모델 추천
 */
export function getRecommendedWhisperModel(): WhisperModelType {
  const totalMemory = Device.totalMemory ?? 0; // bytes
  const totalGB = totalMemory / (1024 ** 3);

  if (totalGB < 2) return 'tiny';
  if (totalGB < 4) return 'small';
  return 'base';
}