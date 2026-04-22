// Practice Goal Configuration
// Defines different practice objectives and their characteristics

import { PracticeGoal } from '@/types';

export interface PracticeGoalConfig {
  value: PracticeGoal;
  label: string;
  description: string;
  icon: string;
  suggestedCEFR: string[];
}

export const practiceGoalConfigs: Record<PracticeGoal, PracticeGoalConfig> = {
  // Existing categories (kept for backward compatibility)
  'daily-life': {
    value: 'daily-life',
    label: 'Daily Life',
    description: 'Everyday activities and routines',
    icon: '🏠',
    suggestedCEFR: ['A1', 'A2', 'B1'],
  },
  'office': {
    value: 'office',
    label: 'Office / Work',
    description: 'Workplace vocabulary and situations',
    icon: '💼',
    suggestedCEFR: ['A2', 'B1', 'B2'],
  },
  'technology': {
    value: 'technology',
    label: 'Technology',
    description: 'Tech topics and digital life',
    icon: '💻',
    suggestedCEFR: ['B1', 'B2', 'C1'],
  },
  'travel': {
    value: 'travel',
    label: 'Travel',
    description: 'Tourism and traveling experiences',
    icon: '✈️',
    suggestedCEFR: ['A1', 'A2', 'B1'],
  },
  'stories': {
    value: 'stories',
    label: 'Short Stories',
    description: 'Narrative fiction for reading practice',
    icon: '📖',
    suggestedCEFR: ['A2', 'B1', 'B2'],
  },
  'general': {
    value: 'general',
    label: 'General',
    description: 'Mixed content for general practice',
    icon: '📝',
    suggestedCEFR: ['A1', 'A2', 'B1', 'B2', 'C1'],
  },
  // New practice goals
  'daily-conversations': {
    value: 'daily-conversations',
    label: 'Daily Conversations',
    description: 'Natural dialogue for everyday situations',
    icon: '💬',
    suggestedCEFR: ['A1', 'A2', 'B1'],
  },
  'work-vocabulary': {
    value: 'work-vocabulary',
    label: 'Work Vocabulary',
    description: 'Professional and job-related terms',
    icon: '📋',
    suggestedCEFR: ['A2', 'B1', 'B2'],
  },
  'common-verbs': {
    value: 'common-verbs',
    label: 'Common Verbs',
    description: 'Practice with frequently used verbs',
    icon: '🔑',
    suggestedCEFR: ['A1', 'A2', 'B1'],
  },
  'professional-emails': {
    value: 'professional-emails',
    label: 'Professional Emails',
    description: 'Business correspondence and formal writing',
    icon: '📧',
    suggestedCEFR: ['B1', 'B2', 'C1'],
  },
  'technical-texts': {
    value: 'technical-texts',
    label: 'Technical Texts',
    description: 'Technical and scientific content',
    icon: '⚙️',
    suggestedCEFR: ['B2', 'C1'],
  },
  'question-answer': {
    value: 'question-answer',
    label: 'Q&A Conversations',
    description: 'Interview-style question and answer pairs',
    icon: '❓',
    suggestedCEFR: ['A1', 'A2', 'B1', 'B2'],
  },
};

export const practiceGoalOptions = Object.values(practiceGoalConfigs).map(config => ({
  value: config.value,
  label: config.label,
  description: config.description,
}));

export const practiceGoalLabels: Record<PracticeGoal, string> = 
  Object.values(practiceGoalConfigs).reduce((acc, config) => {
    acc[config.value] = config.label;
    return acc;
  }, {} as Record<PracticeGoal, string>);