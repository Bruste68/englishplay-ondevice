// ChatScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, Alert, Text, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useVoice } from '../hooks/useVoice';
import { usePersistentChatHistory } from '../context/PersistentChatHistoryContext';
import { usePracticeDialog } from '../hooks/usePracticeDialog';
import { styles } from '../shared/styles/ChatScreen.styles';
import { PracticeDialogView } from '../components/PracticeDialogView';
import FreeChatView from '../components/FreeChatView'; // ✅ default import
import { TOPIC_TITLES } from '../constants/topics';
import { allDialogs } from '../constants/templateDialogs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../hooks/useLanguage';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateFreeTalkFeedback, saveFeedbackToStorage } from '../utils/feedback';
import { useFeedbackStore } from '../store/feedbackStore';
import * as Speech from 'expo-speech';
import { getFeedbackByMode } from '../utils/feedback'; // ✅ 정확한 경로 확인
import { Image } from 'react-native';
import { checkPronunciation } from '../utils/checkPronunciation';
import { feedbackTemplates } from '../constants/feedbackTemplates';
import type {
  Message,
  FeedbackItem,
  DialogState,
  LanguageCode,
  PracticeScene,
  TopicType,
  LevelType
} from '../types';

function ChatScreen() {
  const { topicKey } = useLocalSearchParams();
  const { language } = useLanguage();
  const flatListRef = useRef<FlatList>(null);
  const { setFeedbackAvailable } = useFeedbackStore();

  // ✅ FIX: topicKey로 변경
  const rawTopicKey = Array.isArray(topicKey) ? topicKey[0] : topicKey ?? 'travel';
  const topicKeyResolved: TopicType = TOPIC_TITLES[rawTopicKey] ? (rawTopicKey as TopicType) : 'travel';
  const topicTitle = TOPIC_TITLES[topicKeyResolved] || '대화 연습';

  const [currentLevel, setCurrentLevel] = useState<LevelType>('beginner');
  const [showFullScript, setShowFullScript] = useState(true);
  const [isFreeTalk, setIsFreeTalk] = useState(false);
  const [isMemorizationMode, setIsMemorizationMode] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const { messagesByTopic, addMessage, clearMessages } = usePersistentChatHistory();
  const messages = messagesByTopic?.[topicKeyResolved] ?? [];

  const {
    transcript,
    isRecording,
    error: voiceError,
    startRecording,
    stopRecording,
    clearTranscript,
    startAutoRecording,
    abortWhisper,
  } = useVoice();

  const handlePracticeEnd = async () => {
  
     try {
       // messages와 localMessages를 병합하고 중복 제거
       const combinedMessages = [...messages, ...localMessages].filter(
         (msg, index, self) => 
           index === self.findIndex(m => 
             m.text === msg.text && m.role === msg.role && m.step === msg.step
           )
       );

       // 메시지가 없을 경우에도 기본 세션 정보 저장
       const feedbackData = {
         mode: isFreeTalk ? 'free' : 'practice',
         topic: topicKey,
         sceneTitle: currentScene?.description || 
           (isFreeTalk 
             ? language === 'en' ? 'Free Talk Session' 
               : language === 'ko' ? '자유 대화 세션'
               : language === 'ja' ? 'フリートークセッション'
               : '自由对话环节'
             : 'Practice Session'),
         level: currentLevel,
         createdAt: new Date().toISOString(),
         items: [] as FeedbackItem[],
       };

       // ✅ GPT 호출 제거 → 대신 템플릿 기반 피드백 생성
       const dialogues = practice.scenes[practice.sceneIndex]?.dialogues || [];

       for (let i = 0; i < dialogues.length; i++) {
         const expectedText = dialogues[i].text;
         const userMessage = combinedMessages.find(m => m.step === i && m.role === 'user');

         if (!userMessage || !userMessage.text) continue;

         const missedWords = checkPronunciation(userMessage.text, expectedText);
         const feedbackMessage = missedWords.length === 0
           ? feedbackTemplates.perfect
           : feedbackTemplates.missingWord(missedWords[0]); 

         feedbackData.items.push({
           type: 'pronunciation',
           user: userMessage.text,
           correction: expectedText,
           tip: feedbackMessage,
           role: 'user',
           text: userMessage.text 
         });
       }

       const saveResult = await saveFeedbackToStorage(feedbackData);
    
       if (saveResult) {
         useFeedbackStore.getState().updateFeedbackStats();
       } else {
         console.log('⚠️ [FEEDBACK] Feedback save failed');
       }

     } catch (error) {
       console.error('🔴 [FEEDBACK ERROR] Failed to process feedback:', error);
     }
  };

  const practice = usePracticeDialog({
    topicKey: topicKeyResolved,
    currentLevel,
    transcript,
    clearTranscript,
    addMessage,
    setLocalMessages,
    startRecording, // 추가
    stopRecording, // 추가
    startAutoRecording, // 추가
    isRecording, // 추가
    onPracticeEnd: handlePracticeEnd // ✅ 이렇게 넣어야 함
  });

  useEffect(() => {
    if (voiceError) {
      Alert.alert('음성 인식 오류', voiceError);
    }
  }, [voiceError]);

  const handleRoleToggle = () => {
    if (isFreeTalk) {
      // 프리토크 모드에서의 역할 변경
      practice.toggleRole();
      addMessage(
        topicKeyResolved,
        'ai', // system은 타입에 없음 → ai가 메시지를 전하는 형식
        `이제 당신이 ${practice.isRoleReversed ? 'AI' : 'User'} 역할을 하게 됩니다`,
        { isTemplate: true } // or { isSystem: true } if that's defined
      );
    } else {
      // 연습 모드에서의 역할 변경
      practice.toggleRole();
    }
  };

  const currentScene = practice.scenes?.[practice.sceneIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.push('/feedback')}>
          <Image
            source={require('../assets/images/feedback.png')}
            style={{ width: 60, height: 40, resizeMode: 'contain' }}
          />
        </TouchableOpacity>


         {/* 우측 TOPIC 버튼 */}
         <View style={{ position: 'absolute', right: 5, flexDirection: 'row', gap: 15 }}>
           <Text style={[styles.topicTitle, { paddingTop: 15, fontWeight: 'bold', fontSize: 18 }]}>
               {topicTitle}
           </Text>
           <TouchableOpacity onPress={() => {
              // 모든 음성 활동 정지
              stopRecording();
              Speech.stop();
    
              // 연습 모드 상태 초기화
              practice.setDialogState({
                step: 0,
                isUserTurn: false,
                isActive: false,
                isSpeaking: false,
                isPaused: false,
                loadingSummary: false,
              });
    
              // 로컬 메시지 초기화
              setLocalMessages([]);
    
              // 이전 화면으로 이동
              router.back();
              }}>
             <Image
               source={require('../assets/images/topic.png')}
               style={{ width: 80, height: 50, resizeMode: 'contain' }}
           />
           </TouchableOpacity>

         </View>
      </View>

      {isFreeTalk ? (
        <FreeChatView
          topicKey={topicKeyResolved}
          messages={messages}
          addMessage={addMessage}
          startRecording={startRecording}
          stopRecording={stopRecording}
          isRecording={isRecording}
          transcript={transcript}
          clearTranscript={clearTranscript}
          onExitFreeTalk={() => setIsFreeTalk(false)}
        />
      ) : (
        <PracticeDialogView
          key={`${topicKeyResolved}-${currentLevel}`}
          flatListRef={flatListRef}
          showFullScript={showFullScript}
          setShowFullScript={(val) => {
            setShowFullScript(val);
            setIsMemorizationMode(!val); // 🔄 스크립트 접으면 암기 모드 ON          
          }}
          isMemorizationMode={isMemorizationMode}
          setIsMemorizationMode={setIsMemorizationMode}
          messages={messages}
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
          practice={practice}
          topicKey={topicKeyResolved}
          currentLevel={currentLevel}
          setCurrentLevel={setCurrentLevel}
          onStartFreeTalk={() => {
            clearMessages(topicKeyResolved);      // ✅ 기존 대화 내용 삭제
            clearTranscript();            // ✅ 음성 기록 삭제
            practice.setDialogState({     // ✅ 연습모드 상태 비활성화
              step: 0,
              isUserTurn: false,
              isActive: false,
              isSpeaking: false,
              isPaused: false,
              loadingSummary: false,
            });
            setLocalMessages([]);         // ✅ 프리모드 메시지 초기화
            setIsFreeTalk(true);          // ✅ 프리모드 시작
          }}
          stopAll={() => {
            stopRecording();
            if (Speech && typeof Speech.stop === 'function') {
              Speech.stop();
            }
          }}
          isRoleReversed={practice.isRoleReversed}
          toggleRole={practice.toggleRole}
          startAutoRecording={startAutoRecording}
          onPracticeEnd={handlePracticeEnd}
        />
      )}
    </SafeAreaView>
  );
}

export default ChatScreen;