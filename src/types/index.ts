// Global type definitions for TypeLearn

// CEFR Levels (replaces Level)
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type VerbPracticeTrack = CEFRLevel | 'technical-engineering';

// Practice Goals (replaces Category)
export type PracticeGoal = 
  | 'daily-life'
  | 'office'
  | 'technology'
  | 'travel'
  | 'stories'
  | 'general'
  | 'daily-conversations'
  | 'work-vocabulary'
  | 'common-verbs'
  | 'professional-emails'
  | 'technical-texts'
  | 'question-answer';

// Legacy support (deprecated, use CEFRLevel + PracticeGoal)
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Category = 'daily-life' | 'office' | 'technology' | 'travel' | 'stories' | 'general';

// Length options
export type Length = 'short' | 'medium' | 'long';

// Learning Support options
export type SpanishHints = 'off' | 'key-words' | 'full';
export type BlanksMode = 'off' | 'post-practice';

export type SessionStatus = 'idle' | 'active' | 'completed';

export interface Session {
  id: string;
  source: 'pdf' | 'ai' | 'manual' | 'verbs';
  sourceId?: string;
  text: string;
  title?: string;
  startedAt?: Date;
  completedAt?: Date;
  status: SessionStatus;
  metrics: SessionMetrics;
  metadata?: VerbSessionMetadata;
}

export interface VerbPracticeItem {
  id: string;
  text: string;
  translationEs: string;
  track: VerbPracticeTrack;
  example?: string;
}

export type VerbPracticeGenerationSource = 'ai' | 'fallback';

export interface GenerateVerbPracticeRequest {
  count: number;
  track: VerbPracticeTrack;
}

export interface GenerateVerbPracticeResponse {
  data?: {
    items: VerbPracticeItem[];
    source: VerbPracticeGenerationSource;
    requestedCount: number;
    finalCount: number;
    createdAt: string;
  };
  error?: string;
  code?: string;
}

export interface VerbPracticeAnswerResult {
  itemId: string;
  text: string;
  translationEs: string;
  expected: string;
  answer: string;
  correct: boolean;
}

export interface VerbSessionMetadata {
  type: 'verbs';
  track: VerbPracticeTrack;
  requestedCount: number;
  finalCount: number;
  generationSource: VerbPracticeGenerationSource;
  items: VerbPracticeItem[];
  answers?: VerbPracticeAnswerResult[];
  correctCount?: number;
  incorrectCount?: number;
}

export interface SessionMetrics {
  wpm: number;
  accuracy: number;
  errors: number;
  totalChars: number;
  correctChars: number;
  time: number;
}

export interface PdfSection {
  id: string;
  title: string;
  content: string;
  pageNumber?: number;
}

// Enriched generated content model
export interface GeneratedContent {
  id: string;
  title?: string;
  text: string;
  // Legacy fields (deprecated, use CEFR equivalents)
  level?: Level;
  category?: Category;
  // New CEFR fields
  cefrLevel?: CEFRLevel;
  practiceGoal?: PracticeGoal;
  length?: Length;
  // Learning support
  keyVocabulary?: string[];
  suggestedBlankWords?: string[];
  estimatedDifficulty?: number;
  // Metadata
  createdAt: Date;
}

export interface WordDefinition {
  word: string;
  translation: string;
  definition: string;
  example?: string;
  partOfSpeech: string;
}
