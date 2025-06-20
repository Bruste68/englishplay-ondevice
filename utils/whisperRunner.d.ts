declare module 'react-native-whisper' {
  export interface TranscriptionResult {
    text: string;
    segments?: { text: string; start: number; end: number }[];
  }

  export function loadModel(modelPath: string): Promise<void>;

  export function transcribe(options: { audio: string }): Promise<TranscriptionResult>;
}
