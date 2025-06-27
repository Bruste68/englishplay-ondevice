import { FFmpegKit } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';

/**
 * m4a → wav 변환 함수
 */
export async function convertToWav(m4aPath: string): Promise<string> {
  if (!m4aPath.endsWith('.m4a')) {
    throw new Error('지원되지 않는 오디오 포맷입니다: ' + m4aPath);
  }

  const wavPath = m4aPath.replace('.m4a', '.wav');

  const cmd = `-y -i "${m4aPath}" -ar 16000 -ac 1 -f wav "${wavPath}"`;
  const session = await FFmpegKit.execute(cmd);
  console.log('📋 FFmpeg 실행 명령어:', cmd);
  console.log('📋 FFmpeg 로그:', await session.getAllLogsAsString());

  const returnCode = await session.getReturnCode();
  if (!returnCode || returnCode.isValueSuccess() === false) {
    throw new Error('FFmpeg 변환 실패');
  }

  const wavInfo = await FileSystem.getInfoAsync(wavPath);
  if (!wavInfo.exists || wavInfo.size < 1000) {
    throw new Error('WAV 파일이 비정상적입니다');
  }

  console.log('🎵 WAV 변환 완료:', wavPath);
  return wavPath;
}
