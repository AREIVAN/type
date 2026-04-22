// Length Configuration for practice texts

import { Length } from '@/types';

export interface LengthConfig {
  value: Length;
  label: string;
  description: string;
  wordCountRange: string;
}

export const lengthConfigs: Record<Length, LengthConfig> = {
  short: {
    value: 'short',
    label: 'Short',
    description: 'Quick practice session',
    wordCountRange: '40-80 words',
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    description: 'Standard practice session',
    wordCountRange: '80-150 words',
  },
  long: {
    value: 'long',
    label: 'Long',
    description: 'Extended practice session',
    wordCountRange: '150-300 words',
  },
};

export const lengthOptions = Object.values(lengthConfigs).map(config => ({
  value: config.value,
  label: config.label,
}));