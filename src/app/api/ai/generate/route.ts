import OpenAI, {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  RateLimitError,
} from 'openai';
import { NextResponse } from 'next/server';
import { cefrConfigs } from '@/config/ai-generation/cefrConfig';
import {
  blanksModes as allowedBlanksModes,
  cefrLevels as allowedCefrLevels,
  generationRetryPolicy,
  lengths as allowedLengths,
  practiceGoals as allowedPracticeGoals,
  qualityThresholdsByLength,
  spanishHints as allowedSpanishHints,
} from '@/config/ai-generation/domainRules';
import { lengthConfigs } from '@/config/ai-generation/lengthConfig';
import { practiceGoalConfigs } from '@/config/ai-generation/practiceGoalConfig';
import { BlanksMode, CEFRLevel, GeneratedContent, Length, PracticeGoal, SpanishHints } from '@/types';

export const runtime = 'nodejs';

interface GenerateRequest {
  cefrLevel: CEFRLevel;
  practiceGoal: PracticeGoal;
  length: Length;
  learningSupport?: { spanishHints: SpanishHints; blanksMode: BlanksMode };
}

interface LLMOutput {
  title?: string;
  text: string;
  keyVocabulary?: string[];
  suggestedBlankWords?: string[];
  estimatedDifficulty?: number;
}

type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'SERVER_MISCONFIGURED'
  | 'AI_RATE_LIMITED'
  | 'AI_TIMEOUT'
  | 'AI_UNAVAILABLE'
  | 'AI_BAD_RESPONSE'
  | 'INTERNAL_ERROR';

interface GenerationValidationResult {
  ok: boolean;
  issues: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function jsonError(message: string, status: number, code: ApiErrorCode) {
  return NextResponse.json({ error: message, code }, { status });
}

function parseTimeoutMs(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 20_000;
  }

  return Math.min(60_000, Math.max(5_000, Math.round(parsed)));
}

function isEnumValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T);
}

function parseRequest(body: unknown): { ok: true; data: GenerateRequest } | { ok: false; error: string } {
  if (!isRecord(body)) {
    return { ok: false, error: 'Invalid JSON body.' };
  }

  const cefrLevel = body.cefrLevel;
  const practiceGoal = body.practiceGoal;
  const length = body.length;
  const learningSupport = body.learningSupport;

  if (!isEnumValue(cefrLevel, allowedCefrLevels)) {
    return { ok: false, error: 'Invalid cefrLevel.' };
  }

  if (!isEnumValue(practiceGoal, allowedPracticeGoals)) {
    return { ok: false, error: 'Invalid practiceGoal.' };
  }

  if (!isEnumValue(length, allowedLengths)) {
    return { ok: false, error: 'Invalid length.' };
  }

  if (typeof learningSupport === 'undefined') {
    return {
      ok: true,
      data: {
        cefrLevel,
        practiceGoal,
        length,
        learningSupport: { spanishHints: 'off', blanksMode: 'off' },
      },
    };
  }

  if (!isRecord(learningSupport)) {
    return { ok: false, error: 'Invalid learningSupport.' };
  }

  const selectedSpanishHints = learningSupport.spanishHints;
  const selectedBlanksMode = learningSupport.blanksMode;

  if (!isEnumValue(selectedSpanishHints, allowedSpanishHints)) {
    return { ok: false, error: 'Invalid learningSupport.spanishHints.' };
  }

  if (!isEnumValue(selectedBlanksMode, allowedBlanksModes)) {
    return { ok: false, error: 'Invalid learningSupport.blanksMode.' };
  }

  return {
    ok: true,
    data: {
      cefrLevel,
      practiceGoal,
      length,
      learningSupport: { spanishHints: selectedSpanishHints, blanksMode: selectedBlanksMode },
    },
  };
}

function stripCodeFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function sanitizeList(values: unknown, maxSize = 12): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const deduped = new Set<string>();
  for (const value of values) {
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (normalized.length > 0) {
        deduped.add(normalized);
      }
    }
  }

  return Array.from(deduped).slice(0, maxSize);
}

function parseLLMOutput(raw: string): LLMOutput | null {
  const cleaned = stripCodeFence(raw);

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (!isRecord(parsed) || typeof parsed.text !== 'string') {
      return null;
    }

    const text = parsed.text.trim();
    if (text.length === 0 || text.length > 4000) {
      return null;
    }

    return {
      title: typeof parsed.title === 'string' ? parsed.title.trim() : undefined,
      text,
      keyVocabulary: sanitizeList(parsed.keyVocabulary, 10),
      suggestedBlankWords: sanitizeList(parsed.suggestedBlankWords, 8),
      estimatedDifficulty:
        typeof parsed.estimatedDifficulty === 'number'
          ? Math.max(1, Math.min(10, Math.round(parsed.estimatedDifficulty)))
          : undefined,
    };
  } catch {
    return null;
  }
}

function countWords(value: string): number {
  return value.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
}

function countSentences(value: string): number {
  return value
    .split(/[.!?]+/)
    .map(segment => segment.trim())
    .filter(segment => segment.length > 0).length;
}

function countUniqueWords(value: string): number {
  const words = value.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
  return new Set(words.map(word => word.toLowerCase())).size;
}

function validateGeneratedOutput(output: LLMOutput, input: GenerateRequest): GenerationValidationResult {
  const issues: string[] = [];
  const { min, max } = lengthConfigs[input.length].wordCount;
  const threshold = qualityThresholdsByLength[input.length];
  const wordCount = countWords(output.text);
  const sentenceCount = countSentences(output.text);
  const uniqueWords = countUniqueWords(output.text);
  const nonWordSymbols = output.text.match(/[^A-Za-z0-9\s.,;:'"!?()\-]/g)?.length ?? 0;
  const nonWordRatio = output.text.length === 0 ? 1 : nonWordSymbols / output.text.length;

  if (wordCount < min || wordCount > max) {
    issues.push(`Word count ${wordCount} is outside required range ${min}-${max}.`);
  }

  if (sentenceCount < threshold.minSentences) {
    issues.push(`Text has ${sentenceCount} sentence(s); minimum is ${threshold.minSentences}.`);
  }

  if (uniqueWords < threshold.minUniqueWords) {
    issues.push(`Vocabulary variety is too low (${uniqueWords} unique words; minimum ${threshold.minUniqueWords}).`);
  }

  if (output.keyVocabulary && output.keyVocabulary.length < threshold.minKeyVocabulary) {
    issues.push(
      `keyVocabulary has ${output.keyVocabulary.length} item(s); minimum is ${threshold.minKeyVocabulary}.`
    );
  }

  if (/([A-Za-z])\1{5,}/.test(output.text)) {
    issues.push('Text includes repeated character noise and is not coherent.');
  }

  if (nonWordRatio > 0.08) {
    issues.push('Text includes too much symbol noise and is not acceptable for typing practice.');
  }

  if (!/[A-Za-z]{3,}/.test(output.text)) {
    issues.push('Text does not contain enough valid English words.');
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

function buildUserPrompt(input: GenerateRequest, retryFeedback: string[] = []): string {
  const cefrConfig = cefrConfigs[input.cefrLevel];
  const goalConfig = practiceGoalConfigs[input.practiceGoal];
  const lengthConfig = lengthConfigs[input.length];
  const threshold = qualityThresholdsByLength[input.length];
  const supportHint = input.learningSupport
    ? `Spanish hints: ${input.learningSupport.spanishHints}. Blanks mode: ${input.learningSupport.blanksMode}.`
    : 'Spanish hints: off. Blanks mode: off.';

  const retrySection =
    retryFeedback.length === 0
      ? ''
      : `Previous attempt issues: ${retryFeedback.map((issue, index) => `${index + 1}) ${issue}`).join(' ')}. Regenerate fixing every issue.`;

  return [
    'Create one cohesive typing-practice passage in ENGLISH for an ESL learner.',
    `CEFR level: ${input.cefrLevel}.`,
    `CEFR profile: vocabulary ${cefrConfig.vocabularyComplexity}, sentence structure ${cefrConfig.sentenceStructure}, grammar focus ${cefrConfig.grammarFocus.join(', ')}.`,
    `Practice goal: ${input.practiceGoal} (${goalConfig.label}). Focus on ${goalConfig.generationFocus}.`,
    `Target length: ${lengthConfig.wordCount.min}-${lengthConfig.wordCount.max} words.`,
    `Quality minimums: at least ${threshold.minSentences} sentences and ${threshold.minUniqueWords} unique words.`,
    'The text must be grammatically correct and contextually coherent from beginning to end.',
    supportHint,
    retrySection,
    'Return ONLY valid JSON with this schema:',
    '{"title": string, "text": string, "keyVocabulary": string[], "suggestedBlankWords": string[], "estimatedDifficulty": number}',
    'Rules: strict JSON only, no markdown, no explanations, no additional keys, estimatedDifficulty from 1 to 10.',
  ].join(' ');
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError('Malformed JSON body.', 400, 'BAD_REQUEST');
  }

  const parsed = parseRequest(body);
  if (!parsed.ok) {
    return jsonError(parsed.error, 400, 'BAD_REQUEST');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonError(
      'Missing GROQ_API_KEY. Configure it in your server environment.',
      500,
      'SERVER_MISCONFIGURED'
    );
  }

  const model = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';
  const timeoutMs = parseTimeoutMs(process.env.GROQ_TIMEOUT_MS);
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: timeoutMs,
    maxRetries: 0,
  });

  try {
    const retryIssues: string[] = [];
    let generated: LLMOutput | null = null;

    for (let attempt = 1; attempt <= generationRetryPolicy.maxAttempts; attempt += 1) {
      const completion = await client.chat.completions.create({
        model,
        n: 1,
        temperature: 0.45,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content:
              'You are an English content generator for ESL typing practice. Follow requested CEFR level, goal, and length exactly. Output strict JSON only.',
          },
          {
            role: 'user',
            content: buildUserPrompt(parsed.data, retryIssues),
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        retryIssues.push('Response content was empty.');
        continue;
      }

      const parsedOutput = parseLLMOutput(raw);
      if (!parsedOutput) {
        retryIssues.push('Response was not valid JSON with the required schema.');
        continue;
      }

      const validation = validateGeneratedOutput(parsedOutput, parsed.data);
      if (!validation.ok) {
        retryIssues.push(validation.issues.join(' '));
        continue;
      }

      generated = parsedOutput;
      break;
    }

    if (!generated) {
      const lastIssue = retryIssues[retryIssues.length - 1] ?? 'The model did not satisfy required constraints.';
      return jsonError(
        `Could not generate compliant content after ${generationRetryPolicy.maxAttempts} attempts. Last issue: ${lastIssue}`,
        502,
        'AI_BAD_RESPONSE'
      );
    }

    const content: GeneratedContent = {
      id: crypto.randomUUID(),
      title: generated.title,
      text: generated.text,
      cefrLevel: parsed.data.cefrLevel,
      practiceGoal: parsed.data.practiceGoal,
      length: parsed.data.length,
      keyVocabulary: generated.keyVocabulary,
      suggestedBlankWords: generated.suggestedBlankWords,
      estimatedDifficulty: generated.estimatedDifficulty,
      createdAt: new Date(),
    };

    return NextResponse.json({
      data: {
        ...content,
        createdAt: content.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return jsonError('Rate limit reached in Groq. Please retry in a few seconds.', 429, 'AI_RATE_LIMITED');
    }

    if (error instanceof APIConnectionTimeoutError) {
      return jsonError('AI provider timed out. Please retry.', 504, 'AI_TIMEOUT');
    }

    if (error instanceof APIConnectionError) {
      return jsonError('Could not reach AI provider. Please retry shortly.', 502, 'AI_UNAVAILABLE');
    }

    if (error instanceof AuthenticationError) {
      return jsonError('Invalid Groq credentials on the server.', 500, 'SERVER_MISCONFIGURED');
    }

    if (error instanceof APIError) {
      if (typeof error.status === 'number' && error.status >= 500) {
        return jsonError('Groq service error (5xx). Please retry shortly.', 502, 'AI_UNAVAILABLE');
      }

      return jsonError('Groq rejected this request. Please adjust options and retry.', 400, 'BAD_REQUEST');
    }

    return jsonError('Unexpected error generating AI text. Please try again.', 500, 'INTERNAL_ERROR');
  }
}
