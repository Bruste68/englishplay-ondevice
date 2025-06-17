// types/react-native-whisper.d.ts
declare module 'react-native-whisper' {
  interface WhisperOptions {
    modelPath: string;
    audioPath: string;
    language?: string;
    translate?: boolean;
    isVerbose?: boolean;
  }

  interface WhisperResult {
    text: string;
  }

  const Whisper: {
    start?: (options: WhisperOptions) => Promise<WhisperResult>;
    stop?: () => void;
  };

  export default Whisper;
}
