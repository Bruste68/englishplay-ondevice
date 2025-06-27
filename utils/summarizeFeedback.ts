import type {
  Message,
  FeedbackItem,
  DialogState,
  LanguageCode,
  PracticeScene,
  TopicType,
  LevelType
} from '../types';

export function generateFeedbackSummary(items: FeedbackItem[]) {

  const summary: {
    grammar: { [key: string]: number };
    pronunciation: { [word: string]: number };
  } = {
    grammar: {},
    pronunciation: {},
  };

  items.forEach(item => {
    if (item.type === 'grammar') {
      const key = item.tip?.includes('시제') ? '시제 오류' : item.tip || '기타 문법 오류';
      summary.grammar[key] = (summary.grammar[key] || 0) + 1;
    } else if (item.type === 'pronunciation') {
      const word = item.correction?.split(' ')[0]?.toLowerCase();
      if (word) summary.pronunciation[word] = (summary.pronunciation[word] || 0) + 1;
    }
  });

  return summary;
}

// ✅ summarizeFeedback.ts - 누적된 발음 및 문법 오류 추출 포함

export function summarizeFeedback(feedbackItems: { items: FeedbackItem[] }[]): string[] {
  const repeatedMap: Record<string, number> = {};

  for (const item of feedbackItems) {
    for (const f of item.items) {
      let key = '';
      if (f.type === 'pronunciation') {
        key = `🔊 ${f.correction.split(' ')[0]}`;
      } else if (f.type === 'grammar') {
        key = `📘 ${f.tip?.split('.')[0] || f.correction}`;
      }
      if (key) {
        repeatedMap[key] = (repeatedMap[key] || 0) + 1;
      }
    }
  }

  // 2회 이상 등장한 항목만 추출
  const repeated = Object.entries(repeatedMap)
    .filter(([_, count]) => count > 1)
    .map(([key, _]) => key);

  return repeated;
}