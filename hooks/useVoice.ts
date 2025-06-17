import { useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { OPENAI_API_KEY } from '../constants/secrets';
import { transcribeAudio } from '../utils/whisperTranscriber';


let globalRecordingInstance: Audio.Recording | null = null;
export const isAutoRecordingInProgress = { current: false };

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const silenceTimer = useRef<number | null>(null);
  const isAutoRecordingInProgress = useRef(false);
  const silenceThreshold = 2000;
  const vadIntervalRef = useRef<number | null>(null);
  const isProcessing = useRef(false);

  const cleanupRecording = async (): Promise<void> => {
     if (!globalRecordingInstance) return;
     try {
       console.log('🔴 [RECORDING] Cleaning up recording instance');
       await globalRecordingInstance.stopAndUnloadAsync();
       globalRecordingInstance = null;
     } catch (err) {
       console.error('🔴 [RECORDING ERROR] Cleanup error:', err);
       globalRecordingInstance = null;
     }
  };

  const _startRecording = async (): Promise<boolean> => {
    if (isProcessing.current) return false;
    isProcessing.current = true;

    try {
      console.log('🎙️ [RECORDING] Attempting to start recording...');
      await cleanupRecording();

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Permission denied');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      globalRecordingInstance = recording;
      setIsRecording(true);
      console.log('✅ [RECORDING] Recording started successfully');
      startVADLoop();
      return true;
    } catch (err) {
       console.error('🔴 [RECORDING ERROR] Start failed:', err);
       return false;
    } finally {
       isProcessing.current = false;
    }
  };

  const stopRecording = async (): Promise<void> => {
     console.log('🛑 [RECORDING] Attempting to stop recording...');
     if (!globalRecordingInstance || isProcessing.current) return;
     isProcessing.current = true;

     try {
       const uri = globalRecordingInstance.getURI();
       console.log('📁 [RECORDING] Recorded file URI:', uri);

       const recordingInstance = globalRecordingInstance;
       globalRecordingInstance = null;
       setIsRecording(false);

       await recordingInstance.stopAndUnloadAsync();
       console.log('✅ [RECORDING] Recording stopped');
       if (uri) {
         const text = await transcribeAudio(uri, 'en');
         console.log('📢 [TRANSCRIPT] Whisper returned:', text);
         if (text && text.trim().length >= 3) {
           console.log('🧠 [TRANSCRIPT SET] Setting transcript:', text);
           setTranscript(text);
         } else {
           console.warn('⚠️ [WHISPER] Empty or short transcript');
         }
       }
     } catch (err) {
       console.error('🔴 [RECORDING ERROR] Stop failed:', err);
     } finally {
       isProcessing.current = false;
     }
  };

  const startAutoRecording = async (duration?: number): Promise<void> => {
    if (isAutoRecordingInProgress.current) return;
    isAutoRecordingInProgress.current = true;

    try {
      const success = await _startRecording();
      if (!success) {
        isAutoRecordingInProgress.current = false;
        return;
      }

      if (duration) {
        setTimeout(async () => {
          await stopRecording();
          isAutoRecordingInProgress.current = false;
        }, duration);
      }
    } catch (err) {
      isAutoRecordingInProgress.current = false;
      console.error('🔴 [AUTO RECORDING ERROR]', err);
    }
  };

  const abortWhisper = () => {
    console.log('🚫 [WHISPER] Abort은 온디바이스 모드에선 의미 없음');
  };

  const clearTranscript = () => {
    console.log('🧽 [TRANSCRIPT] Clearing transcript...');
    setTranscript('');
    setError(null);
  };

  const startVADLoop = () => {
    if (!globalRecordingInstance) return;

    console.log('🎧 [VAD] Starting silence detection loop...');
    vadIntervalRef.current = setInterval(async () => {
      if (!globalRecordingInstance) return;
      const status = await globalRecordingInstance.getStatusAsync();
      const volume = status?.metering;

      if (volume != null && volume < -40) {
        if (!silenceTimer.current) {
          silenceTimer.current = setTimeout(() => {
            console.log('🤫 [VAD] Silence detected → stopping recording');
            stopRecording();
          }, silenceThreshold) as unknown as number;
        }
      } else {
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current as unknown as number);
          silenceTimer.current = null;
        }
      }
    }, 200) as unknown as number;
  };

  const stopVADLoop = () => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current as unknown as number);
      vadIntervalRef.current = null;
    }
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current as unknown as number);
      silenceTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopVADLoop();
      cleanupRecording();
    };
  }, []);

  return {
    isRecording,
    transcript,
    error,
    startAutoRecording,
    stopRecording,
    clearTranscript,
    startRecording: _startRecording,
    abortWhisper,
  };
}