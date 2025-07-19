import { useEffect, useState, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import axios from 'axios';
import { WHISPER_URL } from '../lib/env';

console.log(' 위스퍼 주소0:', process.env.EXPO_PUBLIC_WHISPER_URL);

const WHISPER_API_URL = WHISPER_URL;

// ✅ 서버 기반 Whisper 전사 함수 정의
async function transcribeAudio(uri: string, lang = 'en'): Promise<string> {
  try {

    console.log('🎯 Whisper 전송 URL:', `${WHISPER_API_URL}/transcribe`);
    console.log('🎧 Whisper 전송 파일 URI:', uri);

    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'audio/mp4',
      name: 'recording.m4a',
    } as any);
    formData.append('language', lang);

    const response = await axios.post(`${WHISPER_API_URL}/transcribe`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('✅ Whisper 응답 결과:', response.data);
    console.log('🎯 Whisper 요청 주소:', `${WHISPER_API_URL}/transcribe`);

    return response.data?.text || '';
  } catch (err) {
    console.error('❌ [WHISPER API ERROR]', err);
    return '';
  }
}

let globalRecordingInstance: Audio.Recording | null = null;
export const isAutoRecordingInProgress = { current: false };

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const dialogActiveRef = useRef(true); // 기본값 true

  // 외부에서 이 함수로 대화 상태 갱신
  const setDialogActive = (active: boolean) => {
    dialogActiveRef.current = active;
  };

  const silenceTimer = useRef<number | null>(null);
  const isAutoRecordingInProgress = useRef(false);
  const silenceThreshold = 2000;
  const vadIntervalRef = useRef<number | null>(null);
  const isProcessing = useRef(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const addMessage = (text: string, role: 'user' | 'ai', step?: number, meta?: any) => {
    const newMessage = {
      text,
      role,
      step,
      timestamp: Date.now(),
      ...(meta || {}),
    };
    setLocalMessages((prev) => [...prev, newMessage]);
  };

  const cleanupRecording = async (): Promise<void> => {
    if (!globalRecordingInstance) return;
    try {
      await globalRecordingInstance.stopAndUnloadAsync();
      globalRecordingInstance = null;
    } catch (err) {
      console.error('[RECORDING CLEANUP ERROR]', err);
      globalRecordingInstance = null;
    }
  };

  const _startRecording = async (): Promise<boolean> => {
    if (isProcessing.current) return false;
    isProcessing.current = true;

    try {
      await cleanupRecording();

      const { status, canAskAgain } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        if (!canAskAgain) {
          setError('🎤 마이크 권한이 필요합니다. 앱 설정에서 마이크 권한을 허용해주세요.');
        } else {
          // 팝업은 뜰 수 있지만, 거부된 상태
          setError('마이크 권한이 거부되었습니다.');
        }
        throw new Error('Permission denied');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      globalRecordingInstance = recording;
      setIsRecording(true);
      startVADLoop();

      return true;
    } catch (err) {
      console.error('[START RECORDING ERROR]', err);
      return false;
    } finally {
      isProcessing.current = false;
    }
  };

  const stopRecording = async (): Promise<void> => {
    if (!globalRecordingInstance || isProcessing.current) return;
    isProcessing.current = true;

    try {
      const status = await globalRecordingInstance.getStatusAsync();
      if (!status?.isRecording) {
        console.warn('🎤 [STOP] recording은 이미 멈춤 상태');
        globalRecordingInstance = null; // ✅ 반드시 초기화
        setIsRecording(false);
        return;
      }

      const uri = globalRecordingInstance.getURI();
      console.log('🔈 Saving audio URI:', uri); 
      const recordingInstance = globalRecordingInstance;
      globalRecordingInstance = null;
      setIsRecording(false);
      setAudioUri(uri);

      await recordingInstance.stopAndUnloadAsync();

      if (uri) {
        const text = await transcribeAudio(uri, 'en');
        // ✅ 대화가 이미 종료된 상태면 무시
        if (!dialogActiveRef.current) {
          console.log('⛔ 대화가 종료된 상태에서 Whisper 응답 도착 → 무시');
          return;
        }
        if (text && text.trim().length >= 3) {
          setTranscript(text);
        }
      }
    } catch (err) {
      console.error('[STOP RECORDING ERROR]', err);
    } finally {
      isProcessing.current = false;
    }
  };

  // ✅ useVoice.ts에 추가할 것
  const stopAllRecordingLogic = () => {
    stopVADLoop();
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current as unknown as number);
      silenceTimer.current = null;
    }
    isAutoRecordingInProgress.current = false;
    dialogActiveRef.current = false;
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
      console.error('[AUTO RECORDING ERROR]', err);
    }
  };

  const abortWhisper = () => {
    console.log('🚫 [WHISPER] 서버 기반이므로 abort 불필요');
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  const startVADLoop = () => {
    if (!globalRecordingInstance) return;

    vadIntervalRef.current = setInterval(async () => {
      const status = await globalRecordingInstance?.getStatusAsync();
      const volume = status?.metering;

      if (volume != null && volume < -40) {
        if (!silenceTimer.current) {
          silenceTimer.current = setTimeout(() => {
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
    audioUri,
    error,
    startAutoRecording,
    stopRecording,
    clearTranscript,
    addMessage,
    setLocalMessages, 
    startRecording: _startRecording,
    abortWhisper,
    setDialogActive,
    stopAllRecordingLogic,
  };
}
