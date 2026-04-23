// Practice Goal Configuration
// Defines different practice objectives and their characteristics

import { PracticeGoal } from '@/types';

export interface PracticeGoalConfig {
  value: PracticeGoal;
  label: string;
  description: string;
  icon: string;
  suggestedCEFR: string[];
  generationFocus: string;
}

export const practiceGoalConfigs: Record<PracticeGoal, PracticeGoalConfig> = {
  // Existing categories (kept for backward compatibility)
  'daily-life': {
    value: 'daily-life',
    label: 'Daily Life',
    description: 'Everyday activities and routines',
    icon: '🏠',
    suggestedCEFR: ['A1', 'A2', 'B1'],
    generationFocus: 'home routines, shopping, and practical day-to-day situations',
  },
  'office': {
    value: 'office',
    label: 'Office / Work',
    description: 'Workplace vocabulary and situations',
    icon: '💼',
    suggestedCEFR: ['A2', 'B1', 'B2'],
    generationFocus: 'workplace communication, meetings, and team collaboration',
  },
  'technology': {
    value: 'technology',
    label: 'Technology',
    description: 'Tech topics and digital life',
    icon: '💻',
    suggestedCEFR: ['B1', 'B2', 'C1'],
    generationFocus: 'digital tools, software usage, and modern technology contexts',
  },
  'travel': {
    value: 'travel',
    label: 'Travel',
    description: 'Tourism and traveling experiences',
    icon: '✈️',
    suggestedCEFR: ['A1', 'A2', 'B1'],
    generationFocus: 'transport, accommodation, directions, and trip planning',
  },
  'stories': {
    value: 'stories',
    label: 'Short Stories',
    description: 'Narrative fiction for reading practice',
    icon: '📖',
    suggestedCEFR: ['A2', 'B1', 'B2'],
    generationFocus: 'short narrative passages with a clear sequence of events',
  },
  'general': {
    value: 'general',
    label: 'General',
    description: 'Mixed content for general practice',
    icon: '📝',
    suggestedCEFR: ['A1', 'A2', 'B1', 'B2', 'C1'],
    generationFocus: 'balanced, everyday themes without specialized jargon',
  },
  // New practice goals
  'daily-conversations': {
    value: 'daily-conversations',
    label: 'Daily Conversations',
    description: 'Natural dialogue for everyday situations',
    icon: '💬',
    suggestedCEFR: ['A1', 'A2', 'B1'],
    generationFocus: 'natural spoken-style exchanges, greetings, and common social interactions',
  },
  'work-vocabulary': {
    value: 'work-vocabulary',
    label: 'Work Vocabulary',
    description: 'Professional and job-related terms',
    icon: '📋',
    suggestedCEFR: ['A2', 'B1', 'B2'],
    generationFocus: 'professional terms in realistic job-related scenarios',
  },
  'common-verbs': {
    value: 'common-verbs',
    label: 'Common Verbs',
    description: 'Practice with frequently used verbs',
    icon: '🔑',
    suggestedCEFR: ['A1', 'A2', 'B1'],
    generationFocus: 'high-frequency verbs used in practical, contextualized sentences',
  },
  'professional-emails': {
    value: 'professional-emails',
    label: 'Professional Emails',
    description: 'Business correspondence and formal writing',
    icon: '📧',
    suggestedCEFR: ['B1', 'B2', 'C1'],
    generationFocus: 'formal written tone for business requests, updates, and follow-ups',
  },
  'technical-texts': {
    value: 'technical-texts',
    label: 'Technical Texts',
    description: 'Technical and scientific content',
    icon: '⚙️',
    suggestedCEFR: ['B2', 'C1'],
    generationFocus: 'structured technical explanations with domain terminology',
  },
  'question-answer': {
    value: 'question-answer',
    label: 'Q&A Conversations',
    description: 'Interview-style question and answer pairs',
    icon: '❓',
    suggestedCEFR: ['A1', 'A2', 'B1', 'B2'],
    generationFocus: 'clear question-and-answer flow with concise responses',
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
