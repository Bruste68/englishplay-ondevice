// React Native(Android/iOS)에서는 사용 불가
export async function transcribeAudio(audioPath: string): Promise<string> {
  throw new Error('transcribeAudio is not supported on React Native.');
}
