import { BlanksMode, CEFRLevel, GeneratedContent, Length, PracticeGoal, SpanishHints } from '@/types';
import {
  blanksModes as allowedBlanksModes,
  cefrLevels as allowedCefrLevels,
  lengths as allowedLengths,
  practiceGoals as allowedPracticeGoals,
  spanishHints as allowedSpanishHints,
} from '@/config/ai-generation/domainRules';

const CLIENT_TIMEOUT_MS = 25000;

export interface GeneratePracticeTextParams {
  cefrLevel: CEFRLevel;
  practiceGoal: PracticeGoal;
  length: Length;
  learningSupport?: { spanishHints: SpanishHints; blanksMode: BlanksMode };
}

interface GeneratePracticeTextResponse {
  data: Omit<GeneratedContent, 'createdAt'> & { createdAt: string };
  error?: string;
  code?: string;
}

function isEnumValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T);
}

function validateParams(params: GeneratePracticeTextParams): void {
  if (!isEnumValue(params.cefrLevel, allowedCefrLevels)) {
    throw new Error('Invalid CEFR level selection.');
  }

  if (!isEnumValue(params.practiceGoal, allowedPracticeGoals)) {
    throw new Error('Invalid practice goal selection.');
  }

  if (!isEnumValue(params.length, allowedLengths)) {
    throw new Error('Invalid length selection.');
  }

  if (!params.learningSupport) {
    return;
  }

  if (!isEnumValue(params.learningSupport.spanishHints, allowedSpanishHints)) {
    throw new Error('Invalid Spanish hints option.');
  }

  if (!isEnumValue(params.learningSupport.blanksMode, allowedBlanksModes)) {
    throw new Error('Invalid blanks mode option.');
  }
}

export async function generatePracticeText(params: GeneratePracticeTextParams): Promise<GeneratedContent> {
  validateParams(params);

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), CLIENT_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      cache: 'no-store',
      signal: abortController.signal,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The request took too long. Please try again.');
    }

    throw new Error('Network error while contacting AI service. Please retry.');
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json().catch(() => null)) as GeneratePracticeTextResponse | null;

  if (!response.ok) {
    const message = payload?.error ?? 'Could not generate text right now. Please try again.';
    throw new Error(message);
  }

  if (!payload?.data) {
    throw new Error('Invalid response from AI endpoint.');
  }

  return {
    ...payload.data,
    createdAt: new Date(payload.data.createdAt),
  };
}
