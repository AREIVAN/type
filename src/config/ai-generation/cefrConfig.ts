// CEFR Level Configuration
// Maps CEFR levels to generation parameters

import { CEFRLevel } from '@/types';

export interface CEFRConfig {
  value: CEFRLevel;
  label: string;
  description: string;
  vocabularyComplexity: 'minimal' | 'basic' | 'intermediate' | 'advanced';
  sentenceStructure: 'simple' | 'compound' | 'complex' | 'sophisticated';
  wordCountRange: { min: number; max: number };
  grammarFocus: string[];
}

export const cefrConfigs: Record<CEFRLevel, CEFRConfig> = {
  A1: {
    value: 'A1',
    label: 'A1 - Beginner',
    description: 'Can understand and use familiar everyday expressions.',
    vocabularyComplexity: 'minimal',
    sentenceStructure: 'simple',
    wordCountRange: { min: 40, max: 70 },
    grammarFocus: ['present simple', 'can/can\'t', 'basic questions'],
  },
  A2: {
    value: 'A2',
    label: 'A2 - Elementary',
    description: 'Can communicate in simple and routine tasks.',
    vocabularyComplexity: 'basic',
    sentenceStructure: 'simple',
    wordCountRange: { min: 60, max: 100 },
    grammarFocus: ['past simple', 'present continuous', 'comparatives'],
  },
  B1: {
    value: 'B1',
    label: 'B1 - Intermediate',
    description: 'Can deal with most situations likely to arise while traveling.',
    vocabularyComplexity: 'intermediate',
    sentenceStructure: 'compound',
    wordCountRange: { min: 90, max: 140 },
    grammarFocus: ['present perfect', 'future forms', 'modal verbs'],
  },
  B2: {
    value: 'B2',
    label: 'B2 - Upper Intermediate',
    description: 'Can interact with a degree of fluency and spontaneity.',
    vocabularyComplexity: 'intermediate',
    sentenceStructure: 'complex',
    wordCountRange: { min: 130, max: 200 },
    grammarFocus: ['passive voice', 'reported speech', 'complex connectors'],
  },
  C1: {
    value: 'C1',
    label: 'C1 - Advanced',
    description: 'Can express ideas fluently and spontaneously without searching for expressions.',
    vocabularyComplexity: 'advanced',
    sentenceStructure: 'sophisticated',
    wordCountRange: { min: 180, max: 300 },
    grammarFocus: ['advanced modals', ' nuanced expressions', 'idiomatic language'],
  },
};

export const cefrOptions = Object.values(cefrConfigs).map(config => ({
  value: config.value,
  label: config.label,
}));

export const cefrLabels: Record<CEFRLevel, string> = {
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2',
  C1: 'C1',
};