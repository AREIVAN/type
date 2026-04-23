// Length Configuration for practice texts

import { Length } from '@/types';

export interface LengthConfig {
  value: Length;
  label: string;
  description: string;
  wordCountRange: string;
  wordCount: { min: number; max: number };
}

export const lengthConfigs: Record<Length, LengthConfig> = {
  short: {
    value: 'short',
    label: 'Short',
    description: 'Quick practice session',
    wordCountRange: '40-80 words',
    wordCount: { min: 40, max: 80 },
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    description: 'Standard practice session',
    wordCountRange: '80-150 words',
    wordCount: { min: 80, max: 150 },
  },
  long: {
    value: 'long',
    label: 'Long',
    description: 'Extended practice session',
    wordCountRange: '150-300 words',
    wordCount: { min: 150, max: 300 },
  },
};

export const lengthOptions = Object.values(lengthConfigs).map(config => ({
  value: config.value,
  label: config.label,
}));
