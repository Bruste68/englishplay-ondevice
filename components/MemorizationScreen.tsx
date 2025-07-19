import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useVoice } from '../hooks/useVoice';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { LevelType } from '../types';

interface MemorizationProps {
  topicKey: string;
  currentLevel: string;
  practice: any;
  startRecording: () => void;
  stopRecording: () => void;
  stopAll: () => void;
  isRecording: boolean;
}

export const MemorizationView: React.FC<MemorizationProps> = ({
  topicKey,
  currentLevel,
  practice,
  startRecording,
  stopRecording,
  stopAll,
  isRecording,
}) => {
  const { dialogState, setDialogState, scenes, sceneIndex, setSceneIndex, processDialogWithState } = practice;
  const currentScene = scenes?.[sceneIndex];
  const memorizationScrollRef = useRef<ScrollView | null>(null);
  const [isRoleReversed, setIsRoleReversed] = useState(false);

  const { abortWhisper, clearTranscript } = useVoice();

  // 초기 상태: 자동 실행 방지
  useEffect(() => {
    setDialogState({
      step: 0,
      isUserTurn: false,
      isActive: false,
      isSpeaking: false,
      loadingSummary: false,
    });
  }, []);

  // 자동 진행 처리
  useEffect(() => {
    if (
      dialogState.isActive &&
      !dialogState.isPaused &&
      !dialogState.isSpeaking &&
      currentScene?.dialogues?.length > dialogState.step
    ) {
      processDialogWithState(dialogState);
    }
  }, [dialogState]);

  const handleStop = async () => {
    stopAll();
    if (Speech && Speech.stop) await Speech.stop();
    if (abortWhisper) abortWhisper();
    clearTranscript();
    setDialogState({
      step: 0,
      isUserTurn: false,
      isActive: false,
      isSpeaking: false,
      loadingSummary: false,
    });
  };

  const visibleMessages = currentScene?.dialogues?.slice(0, dialogState.step + 1) || [];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🧠 Memorization Mode</Text>

      {/* START 버튼만 보이는 초기 화면 */}
      {!dialogState.isActive && (
        <View style={styles.startContainer}>
          <TouchableOpacity onPress={() => setDialogState(prev => ({ ...prev, isActive: true }))}>
            <Image source={require('../assets/images/play.png')} style={styles.startIcon} />
          </TouchableOpacity>
          <Text style={styles.startLabel}>Press START to begin</Text>
        </View>
      )}

      {/* 대사 출력 */}
      {dialogState.isActive && (
        <ScrollView
          ref={memorizationScrollRef}
          contentContainerStyle={styles.scrollContainer}
          onContentSizeChange={() => memorizationScrollRef.current?.scrollToEnd({ animated: true })}
        >
          {visibleMessages.map((msg, index) => {
            const actualRole = isRoleReversed ? (msg.role === 'user' ? 'ai' : 'user') : msg.role;
            if (actualRole === 'user' && index >= dialogState.step) return null;
            return (
              <View
                key={index}
                style={{
                  flexDirection: actualRole === 'user' ? 'row-reverse' : 'row',
                  marginVertical: 10,
                  paddingHorizontal: 8,
                }}
              >
                <View
                  style={[
                    styles.bubble,
                    actualRole === 'user' ? styles.userBubble : styles.aiBubble,
                    index === visibleMessages.length - 1 && styles.highlight,
                  ]}
                >
                  <Text style={actualRole === 'user' ? styles.userText : styles.aiText}>{msg.text}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* 하단 제어 버튼 */}
      <View style={styles.controlBar}>
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          disabled={!dialogState.isUserTurn || dialogState.isSpeaking}
        >
          <Image
            source={
              isRecording
                ? require('../assets/images/stop.png')
                : require('../assets/images/wait.png')
            }
            style={[styles.icon, (!dialogState.isUserTurn || dialogState.isSpeaking) && { opacity: 0.5 }]}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleStop} disabled={dialogState.isSpeaking}>
          <Image
            source={require('../assets/images/back.png')}
            style={[styles.icon, dialogState.isSpeaking && { opacity: 0.5 }]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  startContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  startIcon: { width: 80, height: 70, resizeMode: 'contain' },
  startLabel: { fontSize: 16, color: '#444', marginTop: 8 },
  scrollContainer: { padding: 16 },
  bubble: {
    borderRadius: 16,
    padding: 16,
    maxWidth: '80%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userBubble: { backgroundColor: '#e3f2fd' },
  aiBubble: { backgroundColor: '#fce4ec' },
  userText: { fontSize: 17, color: '#0d47a1' },
  aiText: { fontSize: 17, color: '#880e4f' },
  highlight: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  icon: { width: 60, height: 50, resizeMode: 'contain' },
});
