// Local storage utilities
import { SessionMetadata, VerbPracticeItem } from '@/types';

const PREFIX = 'typelearn_';

export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PREFIX + key);
}

export function clearAll(): void {
  if (typeof window === 'undefined') return;
  Object.keys(localStorage)
    .filter(key => key.startsWith(PREFIX))
    .forEach(key => localStorage.removeItem(key));
}

// Session history storage
const HISTORY_KEY = 'history';

export interface StoredSession {
  id: string;
  source: string;
  title?: string;
  text: string;
  wpm: number;
  accuracy: number;
  errors: number;
  time: number;
  completedAt: string;
  metadata?: SessionMetadata;
}

const FAILED_VERBS_KEY = 'failed_verbs';

export function getFailedVerbs(): VerbPracticeItem[] {
  return getItem<VerbPracticeItem[]>(FAILED_VERBS_KEY, []);
}

export function saveFailedVerbs(items: VerbPracticeItem[]): void {
  const unique = new Map<string, VerbPracticeItem>();
  for (const item of items) {
    unique.set(`${item.base || item.text}:${item.targetForm ?? 'base'}`.trim().toLowerCase(), item);
  }

  setItem(FAILED_VERBS_KEY, Array.from(unique.values()).slice(0, 50));
}

export function getHistory(): StoredSession[] {
  return getItem<StoredSession[]>(HISTORY_KEY, []);
}

export function saveSession(session: StoredSession): void {
  const history = getHistory();
  history.unshift(session);
  // Keep last 50 sessions
  setItem(HISTORY_KEY, history.slice(0, 50));
}

export function clearHistory(): void {
  setItem(HISTORY_KEY, []);
}

// Recent words storage
const WORDS_KEY = 'recent_words';

export interface StoredWord {
  word: string;
  translation: string;
  viewedAt: string;
}

export function getRecentWords(): StoredWord[] {
  return getItem<StoredWord[]>(WORDS_KEY, []);
}

export function saveRecentWord(word: StoredWord): void {
  const words = getRecentWords();
  const existing = words.findIndex(w => w.word === word.word);
  if (existing !== -1) {
    words.splice(existing, 1);
  }
  words.unshift(word);
  setItem(WORDS_KEY, words.slice(0, 50));
}

function normalizeWeakWord(value: string): string | null {
  const normalized = value.trim().toLowerCase().replace(/[^a-z' -]/g, '').trim();
  if (normalized.length < 3 || normalized.length > 30) {
    return null;
  }

  return normalized;
}

export function getWeakWords(limit = 12): string[] {
  const words = new Set<string>();

  for (const item of getFailedVerbs()) {
    const candidates = [item.text, item.base, item.pastSimple, item.pastParticiple, item.gerund, item.thirdPerson];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') {
        continue;
      }

      const normalized = normalizeWeakWord(candidate);
      if (normalized) {
        words.add(normalized);
      }
    }
  }

  for (const item of getRecentWords()) {
    const normalized = normalizeWeakWord(item.word);
    if (normalized) {
      words.add(normalized);
    }
  }

  return Array.from(words).slice(0, limit);
}

// Settings storage
const SETTINGS_KEY = 'settings';

export interface AppSettings {
  textSize: number;
  showVocabulary: boolean;
  soundEnabled: boolean;
}

const defaultSettings: AppSettings = {
  textSize: 18,
  showVocabulary: true,
  soundEnabled: false,
};

export function getSettings(): AppSettings {
  return getItem<AppSettings>(SETTINGS_KEY, defaultSettings);
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings();
  setItem(SETTINGS_KEY, { ...current, ...settings });
}
