import {
  BlanksMode,
  CEFRLevel,
  GeneratedContent,
  GenerateVerbPracticeRequest,
  GenerateVerbPracticeResponse,
  Length,
  PracticeGoal,
  PracticeObjective,
  PracticeTopic,
  SpanishHints,
} from '@/types';
import { createFallbackPracticeText } from './fallback';
import {
  blanksModes as allowedBlanksModes,
  cefrLevels as allowedCefrLevels,
  lengths as allowedLengths,
  practiceObjectives as allowedPracticeObjectives,
  practiceGoals as allowedPracticeGoals,
  practiceTopics as allowedPracticeTopics,
  spanishHints as allowedSpanishHints,
} from '@/config/ai-generation/domainRules';

const CLIENT_TIMEOUT_MS = 25000;

export interface GeneratePracticeTextParams {
  cefrLevel: CEFRLevel;
  practiceGoal?: PracticeGoal;
  topic: PracticeTopic;
  objective: PracticeObjective;
  length: Length;
  useWeakWords?: boolean;
  weakWords?: string[];
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

  if (params.practiceGoal && !isEnumValue(params.practiceGoal, allowedPracticeGoals)) {
    throw new Error('Invalid practice goal selection.');
  }

  if (!isEnumValue(params.topic, allowedPracticeTopics)) {
    throw new Error('Invalid topic selection.');
  }

  if (!isEnumValue(params.objective, allowedPracticeObjectives)) {
    throw new Error('Invalid practice objective selection.');
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

function isGeneratedContent(value: unknown): value is Omit<GeneratedContent, 'createdAt'> & { createdAt: string } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const content = value as Partial<Omit<GeneratedContent, 'createdAt'> & { createdAt: string }>;
  return (
    typeof content.id === 'string' &&
    typeof content.title === 'string' &&
    typeof content.text === 'string' &&
    content.text.trim().length > 0 &&
    isEnumValue(content.cefrLevel, allowedCefrLevels) &&
    isEnumValue(content.topic, allowedPracticeTopics) &&
    isEnumValue(content.objective, allowedPracticeObjectives) &&
    isEnumValue(content.length, allowedLengths) &&
    Array.isArray(content.keywordsUsed) &&
    typeof content.estimatedDifficulty === 'string' &&
    content.generationSource === 'ai' &&
    typeof content.createdAt === 'string'
  );
}

export async function generatePracticeText(params: GeneratePracticeTextParams): Promise<GeneratedContent> {
  validateParams(params);

  const fallback = () => createFallbackPracticeText({
    cefrLevel: params.cefrLevel,
    topic: params.topic,
    objective: params.objective,
    length: params.length,
    weakWords: params.useWeakWords ? params.weakWords : [],
  });

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
      return fallback();
    }

    return fallback();
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json().catch(() => null)) as GeneratePracticeTextResponse | null;

  if (!response.ok) {
    return fallback();
  }

  if (!isGeneratedContent(payload?.data)) {
    return fallback();
  }

  return {
    ...payload.data,
    createdAt: new Date(payload.data.createdAt),
  };
}

export async function generateVerbPracticeItems(
  params: GenerateVerbPracticeRequest
): Promise<NonNullable<GenerateVerbPracticeResponse['data']>> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), CLIENT_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch('/api/ai/verbs', {
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
      throw new Error('The verb request took too long. Please try again.');
    }

    throw new Error('Network error while generating verb practice. Please retry.');
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json().catch(() => null)) as GenerateVerbPracticeResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Could not generate verb practice right now.');
  }

  if (!payload?.data?.items?.length) {
    throw new Error('Invalid response from verb practice endpoint.');
  }

  return payload.data;
}
