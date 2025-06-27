import { useEffect, useMemo, useState, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { allDialogs } from '../constants/templateDialogs';
import { playBell } from '../utils/playBell';
import type { TopicType, LevelType } from '../types';

interface PracticeDialogHook {
  topicKey: TopicType;
  currentLevel: LevelType;
  transcript: string;
  clearTranscript: () => void;
  addMessage: (topic: string, role: 'user' | 'ai', text: string, meta?: any) => void;
  setLocalMessages: React.Dispatch<React.SetStateAction<any[]>>;
  startAutoRecording: (duration?: number) => Promise<void>;
  isRecording: boolean;
  userResponseDelay?: number;
  step?: number;
  isUserTurn?: boolean;
  isActive?: boolean;
  isSpeaking?: boolean;
  loadingSummary?: boolean;
  isPaused?: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  onPracticeEnd?: () => void; // ✅ 명확히 props에 포함
}

interface DialogState {
  step: number;
  isUserTurn: boolean;
  isActive: boolean;
  isSpeaking: boolean;
  loadingSummary: boolean;
  isPaused: boolean;
}

export function usePracticeDialog(props: PracticeDialogHook) {
  const {
    topicKey,
    currentLevel,
    transcript,
    clearTranscript,
    addMessage,
    setLocalMessages,
    startAutoRecording,
    isRecording,
    stopRecording,
    userResponseDelay = 5,
    onPracticeEnd, // ✅ 여기서 안전하게 분리해서 사용
  } = props;

  const [sceneIndex, setSceneIndex] = useState(0);
  const [dialogState, setDialogState] = useState<DialogState>({
    step: 0,
    isUserTurn: false,
    isActive: false,
    isSpeaking: false,
    loadingSummary: false,
    isPaused: false,
  });


  const [isRoleReversed, setIsRoleReversed] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [isMemorizationMode, setIsMemorizationMode] = useState(false);
  const isProcessingRef = useRef(false);
  const lastProcessedStep = useRef(0);
  const dialogStateRef = useRef(dialogState);
  const roleToggleCount = useRef(0);

  const scenes = useMemo(() => {
    console.log(`📚 [DIALOG] Loading scenes for ${topicKey} - ${currentLevel}`);
    return allDialogs?.[topicKey as TopicType]?.[currentLevel as LevelType] ?? [];
  }, [topicKey, currentLevel]);

  const playBellSound = async () => {
     try {
       const { sound } = await Audio.Sound.createAsync(
         require('../assets/sounds/bbi.mp3') // ← 사운드 파일 위치
       );
       await sound.playAsync();
     } catch (error) {
       console.warn('❗벨소리 재생 실패:', error);
     }
  };

  const togglePracticeMode = () => {
    const newMode = !practiceMode;
    console.log(`🔄 [MODE] Practice mode ${newMode ? 'enabled' : 'disabled'}`);
    setPracticeMode(newMode);

    const initialState = {
      step: 0,
      isUserTurn: isRoleReversed,
      isActive: newMode,
      isSpeaking: false,
      isPaused: !newMode, // ✅ 시작할 때만 false로, 일시중지 시 true 유지
      loadingSummary: false,
    };
    setDialogState(initialState);
    if (newMode) {
      if (isRoleReversed) {
        console.log('🎤 [START] 사용자부터 시작 - 자동 녹음');
        setTimeout(() => {
          startAutoRecording(userResponseDelay * 1000);
        }, 500);
      } else {
        console.log('🤖 [START] AI부터 시작 - 대사 실행');
        setTimeout(() => {
          processDialogWithState();
        }, 500);
      }
    }
  };

  const toggleRole = async () => {
     try {
       if (isProcessingRef.current) {
         console.log('⏸️ [ROLE] Role toggle skipped - already processing');
         return;
       }
       isProcessingRef.current = true;

       const isModeActive = practiceMode || isMemorizationMode;

       // ✅ 두 번째 역할 변경 시 초기 상태로 리셋
       if (roleToggleCount.current >= 1) {
         console.log('🔁 두 번째 역할 변경 감지: 완전 초기화');

         const resetState = {
           step: 0,
           isUserTurn: false, // AI부터 시작
           isActive: true,
           isSpeaking: false,
           loadingSummary: false,
           isPaused: false,
         };

         setIsRoleReversed(false); // 역할 되돌림
         setDialogState(resetState);
         roleToggleCount.current = 0; // 카운터 초기화

         addMessage(topicKey, 'ai', '역할이 초기화되어 AI부터 다시 시작합니다', {
           isSystem: true,
         });

         setTimeout(() => processDialogWithState(), 500);
         return;
       }

       const newRoleReversed = !isRoleReversed;
       console.log(`🔄 [ROLE] Role reversed: ${newRoleReversed}`);

       // 모든 음성 활동 정지
       await stopRecording();
       await Speech.stop();

       // 상태 초기화
       const initialState = {
         step: 0,
         isUserTurn: newRoleReversed, // 새 역할에 따라 첫 차례 설정
         isActive: true,
         isSpeaking: false,
         loadingSummary: false,
         isPaused: false,
       };

       setIsRoleReversed(newRoleReversed);
       setDialogState(initialState);

       // 안내 메시지 추가
       addMessage(topicKey, 'ai', `이제 당신이 ${newRoleReversed ? 'AI' : 'User'} 역할을 하게 됩니다`, {
          isSystem: true,
       });

       console.log('✅ 시스템 메시지 추가됨');

       roleToggleCount.current += 1; // ✅ 첫 변경 시 카운터 증가

       // 새 역할에 따른 처리
       if (newRoleReversed) {
         // AI 역할: 사용자 입력 기다림
         setTimeout(async () => {
           await startAutoRecording(userResponseDelay * 1000);
         }, 1000);
       } else {
         // User 역할: AI가 먼저 말함
         setTimeout(() => {
           processDialogWithState();
         }, 500);
       }
     } catch (err) {
       console.error('🔴 [ROLE ERROR] Role toggle failed:', err);
       // 에러 복구
       setDialogState({
         step: 0,
         isUserTurn: false,
         isActive: false,
         isSpeaking: false,
         loadingSummary: false,
         isPaused: false,
       });
     } finally {
       isProcessingRef.current = false;
     }
  };

  const processDialogWithState = async () => {
    console.log(`🤖 [DIALOG] Current role: ${isRoleReversed ? 'AI' : 'User'}, Step: ${dialogState.step}`);
    if (dialogState.isPaused || !dialogState.isActive || dialogState.isSpeaking) { 
      console.log('⏸️ [SKIP] Dialog is paused or inactive');
      return;
    }

    if (isProcessingRef.current) {
      console.log('🚫 [SKIP] Already processing');
      return;
    }
    isProcessingRef.current = true;

    try {
      const scene = scenes[sceneIndex];
      if (!scene?.dialogues) {
        console.warn('❌ [ERROR] No scene loaded');
        return;
      }
      console.log(`📜 [SCENE] Dialogues length: ${scene.dialogues.length}`);

      if (!scene?.dialogues || dialogState.step >= scene.dialogues.length) {
         console.log('✅ [DIALOG END] Scene ended → Ending session');
         // 대화 종료 처리
         setDialogState({
           step: 0,
           isUserTurn: false,
           isActive: false,
           isSpeaking: false,
           loadingSummary: false,
           isPaused: false,
         });
         if (typeof onPracticeEnd === 'function') {
           console.log('📩 [END] Calling onPracticeEnd() from AI');
           await onPracticeEnd();
         }
         return;
      }

      const currentLine = scene.dialogues[dialogState.step];
      const actualRole = isRoleReversed ? 
         (currentLine.role === 'user' ? 'ai' : 'user') : 
         currentLine.role;

      if (actualRole === 'ai') {
        console.log(`🗣️ [AI] Speaking: "${currentLine.text}"`);
        setDialogState(prev => ({ ...prev, isSpeaking: true }));

        await new Promise(resolve => {
          Speech.speak(currentLine.text, {
            language: 'en',
            onDone: () => resolve(undefined),
            onStopped: () => resolve(undefined),
          });
        });

        // 다음 단계로 이동
        const newStep = dialogState.step + 1;
        const sceneEnded = newStep >= scene.dialogues.length;
        console.log(`📊 [STEP] newStep: ${newStep} / scene length: ${scene.dialogues.length}`);
        if (newStep >= scene.dialogues.length) {
           console.log('🏁 [AI] Finished last line. Calling onPracticeEnd()');
           setDialogState({
             step: 0,
             isUserTurn: false,
             isActive: false,
             isSpeaking: false,
             loadingSummary: false,
             isPaused: false,
           });

           if (typeof onPracticeEnd === 'function') {
             console.log('📩 [END] Calling onPracticeEnd() from AI → second block');
             await onPracticeEnd(); // ✅ 이게 없어서 문제 발생
           }
           return;
        }
        const nextLine = scene.dialogues[newStep];
        const nextIsUserTurn = isRoleReversed ? 
           (nextLine.role === 'ai') : 
           (nextLine.role === 'user');
    
        console.log(`🧭 [NEXT] isUserTurn: ${nextIsUserTurn} → ${nextLine?.text}`);
        setDialogState({
           step: newStep,
           isUserTurn: nextIsUserTurn,
           isActive: true,
           isSpeaking: false,
           loadingSummary: false,
           isPaused: false,
        });

        if (nextIsUserTurn) {
           console.log('🔔 [NEXT] Playing bell and starting auto recording');
           setTimeout(async () => {
             await playBell('beep');
             await startAutoRecording(userResponseDelay * 1000);
           }, 1000);
        } else {
           console.log('🔄 [RECURSE] Triggering next AI line');
           processDialogWithState();
        }
      }
    } catch (err) {
       console.error('🔴 [DIALOG ERROR] Process error:', err);

    } finally {
       isProcessingRef.current = false;
    }
  };

  const handlePausePractice = async () => {
     if (dialogState.step === 0 && dialogState.isUserTurn) {
       console.log('⏸️ [PAUSE BLOCKED] Cannot pause during first user turn');
       return;
     }
     try {
       stopRecording(); // 녹음 중지
       if (Speech && typeof Speech.stop === 'function') {
         await Speech.stop(); // TTS 중지
       }

       setDialogState(prev => ({
         ...prev,
         isActive: false,
         isSpeaking: false,
         isPaused: true,
       }));

       console.log('⏸️ [PAUSE] Practice paused');
     } catch (error) {
       console.error('Error in handlePausePractice:', error);
     }
  };

  const handleResumePractice = () => {
     if (!dialogState.isPaused) return;

     const currentScene = scenes[sceneIndex];
     const currentStep = dialogState.step;
     const previousStep = Math.max(currentStep - 1, 0);
     const line = currentScene?.dialogues?.[previousStep];

     if (!line) {
       console.warn('❗ [RESUME] Cannot find previous line');
       return;
     }

     const actualRole = isRoleReversed
       ? line.role === 'user' ? 'ai' : 'user'
       : line.role;

     const restoredState = {
       step: previousStep,
       isUserTurn: actualRole === 'user',
       isActive: true,
       isPaused: false,
       isSpeaking: false,
       loadingSummary: false,
     };

     setDialogState(restoredState);

     setTimeout(() => {
       if (actualRole === 'ai') {
         console.log('🤖 [RESUME] Restarting AI turn at step:', previousStep);
         processDialogWithState();
       } else {
         console.log('🎤 [RESUME] Restarting user turn at step:', previousStep);
         startAutoRecording();
       }
     }, 100);
  };

  const handleUserResponse = () => {
     if (!transcript || (!practiceMode && !isMemorizationMode) || !dialogState.isUserTurn) return;

     // ✅ Whisper 결과를 localMessages에 저장
     setLocalMessages(prev => [...prev, {
       role: 'user',
       text: transcript,
       timestamp: new Date().toISOString(),
       step: dialogState.step,
     }]);

     addMessage(topicKey, 'user', transcript, { scene: sceneIndex, step: dialogState.step });
     setLocalMessages(prev => [...prev, {
       role: 'user',
       text: transcript,
       timestamp: new Date().toISOString(),
     }]);

     clearTranscript();

     const newStep = dialogState.step + 1;
     const scene = scenes[sceneIndex];

     if (newStep >= scene.dialogues.length) {
       console.log('🏁 [USER] 마지막 응답 후 연습 종료');

       // 피드백 콜백 호출 방식 개선
       setTimeout(async () => {
         if (typeof onPracticeEnd === 'function') {
           await onPracticeEnd();
         }
       }, 500);

       setDialogState({
         step: 0,
         isActive: false,
         isUserTurn: false,
         isSpeaking: false,
         loadingSummary: false,
         isPaused: false,
       });
       setPracticeMode(false);
       return;
     }

     const nextLine = scene.dialogues[newStep];
     const newState = {
       step: newStep,
       isUserTurn: nextLine.role === 'user',
       isActive: true,
       isSpeaking: false,
       loadingSummary: false,
     };

     setDialogState({
       ...newState,
       isPaused: false, // 또는 true, 의도에 따라
     });
     lastProcessedStep.current = newStep;
  };

  useEffect(() => {
     dialogStateRef.current = dialogState;
  }, [dialogState]);

  useEffect(() => {
     const isPaused = dialogStateRef.current.isPaused;

     if (
       transcript &&
       (practiceMode || isMemorizationMode) &&
       dialogState.isUserTurn &&
       !isPaused
     ) {
       handleUserResponse();
     }
  }, [transcript]);

  useEffect(() => {
     if (
       (practiceMode || isMemorizationMode) &&
       dialogState.isActive &&
       !dialogState.isSpeaking &&
       !dialogState.isPaused &&  // ✅ 반드시 Resume 눌렀을 때만 실행
       scenes.length > 0
     ) {
       processDialogWithState();
     }
  }, [practiceMode, isMemorizationMode, dialogState.step, dialogState.isActive, dialogState.isPaused]);


  return {
    dialogState,
    processDialogWithState,
    togglePracticeMode,
    practiceMode,
    scenes,
    sceneIndex,
    setSceneIndex,
    toggleRole,
    isRoleReversed,
    isMemorizationMode,
    setIsMemorizationMode,
    setDialogState,
    handlePausePractice,
    handleResumePractice,
  };
}