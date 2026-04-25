import { fallbackVerbBank, MAX_VERB_COUNT, MIN_VERB_COUNT, verbPracticeTracks } from '@/config/verb-practice/fallbackBank';
import { VerbPracticeItem, VerbPracticeTrack } from '@/types';

export interface VerbItemRange {
  itemId: string;
  start: number;
  end: number;
}

export type VerbTypingCharacterStatus = 'correct' | 'incorrect' | 'pending' | 'current' | 'extra';

export interface VerbTypingCharacter {
  character: string;
  status: VerbTypingCharacterStatus;
}

export function isVerbPracticeTrack(value: unknown): value is VerbPracticeTrack {
  return typeof value === 'string' && verbPracticeTracks.includes(value as VerbPracticeTrack);
}

export function clampVerbCount(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return MIN_VERB_COUNT;
  }

  return Math.min(MAX_VERB_COUNT, Math.max(MIN_VERB_COUNT, Math.round(parsed)));
}

export function normalizeVerbText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function isCorrectVerbAnswer(answer: string, expected: string): boolean {
  return normalizeVerbText(answer) === normalizeVerbText(expected);
}

export function extractSubmittedVerbAnswer(value: string): { answer: string; remainder: string } | null {
  const separatorMatch = /[\s.·]+/.exec(value);
  if (!separatorMatch || separatorMatch.index === undefined) {
    return null;
  }

  return {
    answer: value.slice(0, separatorMatch.index).trim(),
    remainder: value.slice(separatorMatch.index + separatorMatch[0].length).trimStart(),
  };
}

export function isVerbAnswerComplete(answer: string, expected: string): boolean {
  return answer.trim().length >= expected.trim().length;
}

export function mapVerbTypingCharacters(
  expected: string,
  answer: string,
  options: { active?: boolean } = {}
): VerbTypingCharacter[] {
  const expectedCharacters = [...expected];
  const answerCharacters = [...answer];
  const characters: VerbTypingCharacter[] = expectedCharacters.map((character, index) => {
    const typedCharacter = answerCharacters[index];

    if (typedCharacter === undefined) {
      return {
        character,
        status: options.active && index === answerCharacters.length ? 'current' : 'pending',
      };
    }

    return {
      character,
      status: typedCharacter.toLowerCase() === character.toLowerCase() ? 'correct' : 'incorrect',
    };
  });

  for (let index = expectedCharacters.length; index < answerCharacters.length; index += 1) {
    characters.push({ character: answerCharacters[index], status: 'extra' });
  }

  return characters;
}

export function dedupeVerbItems(items: VerbPracticeItem[]): VerbPracticeItem[] {
  const seen = new Set<string>();
  const unique: VerbPracticeItem[] = [];

  for (const item of items) {
    const key = normalizeVerbText(item.text);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
}

export function sanitizeVerbItems(items: unknown, track: VerbPracticeTrack): VerbPracticeItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const sanitized: VerbPracticeItem[] = [];

  for (const value of items) {
    if (typeof value !== 'object' || value === null) {
      continue;
    }

    const record = value as Record<string, unknown>;
    const text = typeof record.text === 'string' ? record.text.trim().replace(/\s+/g, ' ') : '';
    const translationEs =
      typeof record.translationEs === 'string' ? record.translationEs.trim().replace(/\s+/g, ' ') : '';
    const example = typeof record.example === 'string' ? record.example.trim().replace(/\s+/g, ' ') : undefined;
    const itemTrack = isVerbPracticeTrack(record.track) ? record.track : track;

    if (!text || /\s/.test(text) || !translationEs || text.length > 80 || translationEs.length > 120 || itemTrack !== track) {
      continue;
    }

    sanitized.push({
      id: typeof record.id === 'string' && record.id.trim() ? record.id.trim() : crypto.randomUUID(),
      text,
      translationEs,
      example: example || undefined,
      track,
    });
  }

  return dedupeVerbItems(sanitized);
}

export function fillWithFallbackItems(
  items: VerbPracticeItem[],
  track: VerbPracticeTrack,
  count: number,
  preferredItems: VerbPracticeItem[] = []
): VerbPracticeItem[] {
  const targetCount = clampVerbCount(count);
  const base = dedupeVerbItems([...preferredItems, ...items]);
  const fallback = fallbackVerbBank[track] ?? [];
  return dedupeVerbItems([...base, ...fallback]).slice(0, Math.min(targetCount, fallback.length + base.length));
}

export function buildVerbPracticeText(items: VerbPracticeItem[]): string {
  return items.map(item => item.text).join('\n');
}

export function mapVerbItemRanges(items: VerbPracticeItem[]): VerbItemRange[] {
  let cursor = 0;

  return items.map((item, index) => {
    const start = cursor;
    const end = start + item.text.length;
    cursor = end + (index === items.length - 1 ? 0 : 1);
    return { itemId: item.id, start, end };
  });
}
