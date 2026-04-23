import { BlanksMode, CEFRLevel, Length, PracticeGoal, SpanishHints } from '@/types';
import { cefrConfigs } from './cefrConfig';
import { lengthConfigs } from './lengthConfig';
import { practiceGoalConfigs } from './practiceGoalConfig';

function typedKeys<T extends string>(value: Record<T, unknown>): T[] {
  return Object.keys(value) as T[];
}

export const cefrLevels = typedKeys(cefrConfigs) as readonly CEFRLevel[];
export const practiceGoals = typedKeys(practiceGoalConfigs) as readonly PracticeGoal[];
export const lengths = typedKeys(lengthConfigs) as readonly Length[];

export const spanishHints: readonly SpanishHints[] = ['off', 'key-words', 'full'];
export const blanksModes: readonly BlanksMode[] = ['off', 'post-practice'];

export const generationRetryPolicy = {
  maxAttempts: 3,
} as const;

export interface QualityThreshold {
  minSentences: number;
  minUniqueWords: number;
  minKeyVocabulary: number;
}

export const qualityThresholdsByLength: Record<Length, QualityThreshold> = {
  short: {
    minSentences: 2,
    minUniqueWords: 22,
    minKeyVocabulary: 3,
  },
  medium: {
    minSentences: 3,
    minUniqueWords: 35,
    minKeyVocabulary: 4,
  },
  long: {
    minSentences: 4,
    minUniqueWords: 55,
    minKeyVocabulary: 5,
  },
};
