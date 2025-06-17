import { create } from 'zustand';

interface FeedbackState {
  hasFeedback: boolean;
  lastFeedbackDate: string | null;
  feedbackCount: number;
  setFeedbackAvailable: (hasFeedback: boolean) => void;
  updateFeedbackStats: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  hasFeedback: false,
  lastFeedbackDate: null,
  feedbackCount: 0,
  setFeedbackAvailable: (hasFeedback) => set({ hasFeedback }),
  updateFeedbackStats: () => set((state) => ({
    hasFeedback: true,
    lastFeedbackDate: new Date().toISOString(),
    feedbackCount: state.feedbackCount + 1
  })),
}));