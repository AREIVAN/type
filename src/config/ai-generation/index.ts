// Learning Support Configuration
// Options for extra practice features

import { SpanishHints, BlanksMode } from '@/types';

export interface LearningSupportConfig {
  spanishHints: SpanishHints;
  reuseDifficultWords: boolean;
  blanksMode: BlanksMode;
}

export interface SpanishHintOption {
  value: SpanishHints;
  label: string;
  description: string;
}

export const spanishHintOptions: SpanishHintOption[] = [
  {
    value: 'off',
    label: 'Off',
    description: 'No translation hints',
  },
  {
    value: 'key-words',
    label: 'Key Words',
    description: 'Show translation for important words',
  },
  {
    value: 'full',
    label: 'Full',
    description: 'Full translation support (coming soon)',
    // Note: Full mode needs UI implementation
  },
];

export interface BlanksModeOption {
  value: BlanksMode;
  label: string;
  description: string;
}

export const blanksModeOptions: BlanksModeOption[] = [
  {
    value: 'off',
    label: 'Off',
    description: 'Normal typing practice',
  },
  {
    value: 'post-practice',
    label: 'Post-Practice',
    description: 'Fill-in-the-blank review after practice',
  },
];

export const defaultLearningSupport: LearningSupportConfig = {
  spanishHints: 'off',
  reuseDifficultWords: false,
  blanksMode: 'off',
};

// Difficulty estimates by CEFR
export const difficultyEstimates: Record<string, number> = {
  A1: 2,
  A2: 4,
  B1: 5,
  B2: 7,
  C1: 9,
};