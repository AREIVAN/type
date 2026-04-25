// Global type definitions for TypeLearn

// CEFR Levels (replaces Level)
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type VerbPracticeTrack = CEFRLevel | 'technical-engineering';
export type VerbPracticeForm = 'base' | 'pastSimple' | 'pastParticiple' | 'gerund' | 'thirdPerson';
export type VerbPracticeType = VerbPracticeForm | 'mixed';
export type PracticeTopic =
  | 'daily-conversation'
  | 'work'
  | 'travel'
  | 'job-interview'
  | 'emails'
  | 'meetings'
  | 'engineering'
  | 'maintenance'
  | 'automation'
  | 'technical-vocabulary';
export type PracticeObjective =
  | 'vocabulary'
  | 'reading-fluency'
  | 'spelling-accuracy'
  | 'common-verbs'
  | 'technical-english'
  | 'weak-words-review'
  | 'business-english';

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
  metadata?: SessionMetadata;
}

export interface VerbPracticeItem {
  id: string;
  base: string;
  spanish: string;
  pastSimple: string;
  pastParticiple: string;
  gerund: string;
  thirdPerson: string;
  targetForm: VerbPracticeForm;
  text: string;
  translationEs: string;
  track: VerbPracticeTrack;
  level?: VerbPracticeTrack;
  category?: string;
  example?: string;
  examples?: Partial<Record<VerbPracticeForm, string>>;
}

export type VerbPracticeGenerationSource = 'ai' | 'fallback';

export interface GenerateVerbPracticeRequest {
  count: number;
  track: VerbPracticeTrack;
  practiceType?: VerbPracticeType;
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
  base: string;
  spanish: string;
  targetForm: VerbPracticeForm;
  text: string;
  translationEs: string;
  expected: string;
  answer: string;
  correct: boolean;
  recallTimeMs: number;
  errors: number;
}

export interface VerbSessionMetadata {
  type: 'verbs';
  track: VerbPracticeTrack;
  practiceType?: VerbPracticeType;
  requestedCount: number;
  finalCount: number;
  generationSource: VerbPracticeGenerationSource;
  items: VerbPracticeItem[];
  answers?: VerbPracticeAnswerResult[];
  correctCount?: number;
  incorrectCount?: number;
  failedCount?: number;
  averageRecallTimeMs?: number;
  masteryPercentage?: number;
}

export interface AISessionMetadata {
  type: 'ai';
  generationSource: 'ai' | 'fallback';
  cefrLevel: CEFRLevel;
  topic: PracticeTopic;
  objective: PracticeObjective;
  weakWordsUsed: string[];
  technicalVocabularyUsed: string[];
  textLength: Length;
  title: string;
}

export type SessionMetadata = VerbSessionMetadata | AISessionMetadata;

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
  topic?: PracticeTopic;
  objective?: PracticeObjective;
  length?: Length;
  // Learning support
  keyVocabulary?: string[];
  keywordsUsed?: string[];
  suggestedBlankWords?: string[];
  estimatedDifficulty?: string;
  generationSource?: 'ai' | 'fallback';
  weakWordsUsed?: string[];
  technicalVocabularyUsed?: string[];
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
