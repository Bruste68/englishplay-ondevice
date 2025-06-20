import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';

type BellType = 'dingdong' | 'beep' | 'toou';

export async function initializeAudioMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

export async function playBell(type: BellType = 'beep'): Promise<void> {
  try {
    const bellMap: Record<BellType, any> = {
      dingdong: require('../assets/sounds/alarm.mp3'),
      beep: require('../assets/sounds/bbi.mp3'),
      toou: require('../assets/sounds/bbok.mp3'),
    };

    const source = bellMap[type];
    if (!source) {
      console.warn('❌ 사운드 파일 없음:', type);
      return;
    }

    const { sound } = await Audio.Sound.createAsync(source);
    await sound.setVolumeAsync(0.3);

    // ✅ 재생 완료까지 기다리기
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && (status as AVPlaybackStatusSuccess).didJustFinish) {
          resolve();
        }
      });
      sound.playAsync();
    });

    await sound.unloadAsync();
  } catch (error) {
    console.warn('🔈 Bell sound error:', error);
  }
}