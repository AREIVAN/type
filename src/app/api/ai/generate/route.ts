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
  practiceObjectives as allowedPracticeObjectives,
  practiceGoals as allowedPracticeGoals,
  practiceTopics as allowedPracticeTopics,
  qualityThresholdsByLength,
  spanishHints as allowedSpanishHints,
} from '@/config/ai-generation/domainRules';
import { lengthConfigs } from '@/config/ai-generation/lengthConfig';
import {
  getObjectiveLabel,
  getObjectivePrompt,
  getTopicLabel,
  getTopicPrompt,
  requiresTechnicalVocabulary,
} from '@/config/ai-generation/personalizationConfig';
import {
  BlanksMode,
  CEFRLevel,
  GeneratedContent,
  Length,
  PracticeGoal,
  PracticeObjective,
  PracticeTopic,
  SpanishHints,
} from '@/types';

export const runtime = 'nodejs';

interface GenerateRequest {
  cefrLevel: CEFRLevel;
  practiceGoal?: PracticeGoal;
  topic: PracticeTopic;
  objective: PracticeObjective;
  length: Length;
  useWeakWords?: boolean;
  weakWords?: string[];
  learningSupport?: { spanishHints: SpanishHints; blanksMode: BlanksMode };
}

interface LLMOutput {
  title?: string;
  text: string;
  keywordsUsed?: string[];
  suggestedBlankWords?: string[];
  estimatedDifficulty?: string;
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
  const topic = body.topic;
  const objective = body.objective;
  const length = body.length;
  const useWeakWords = body.useWeakWords === true;
  const weakWords = sanitizeList(body.weakWords, 12);
  const learningSupport = body.learningSupport;

  if (!isEnumValue(cefrLevel, allowedCefrLevels)) {
    return { ok: false, error: 'Invalid cefrLevel.' };
  }

  if (typeof practiceGoal !== 'undefined' && !isEnumValue(practiceGoal, allowedPracticeGoals)) {
    return { ok: false, error: 'Invalid practiceGoal.' };
  }

  if (!isEnumValue(topic, allowedPracticeTopics)) {
    return { ok: false, error: 'Invalid topic.' };
  }

  if (!isEnumValue(objective, allowedPracticeObjectives)) {
    return { ok: false, error: 'Invalid objective.' };
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
        topic,
        objective,
        length,
        useWeakWords,
        weakWords,
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
      topic,
      objective,
      length,
      useWeakWords,
      weakWords,
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
      keywordsUsed: sanitizeList(parsed.keywordsUsed, 10),
      suggestedBlankWords: sanitizeList(parsed.suggestedBlankWords, 8),
      estimatedDifficulty:
        typeof parsed.estimatedDifficulty === 'string'
          ? parsed.estimatedDifficulty.trim().slice(0, 80)
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

  if (!output.keywordsUsed || output.keywordsUsed.length < threshold.minKeyVocabulary) {
    issues.push(
      `keywordsUsed has ${output.keywordsUsed?.length ?? 0} item(s); minimum is ${threshold.minKeyVocabulary}.`
    );
  }

  if (!output.estimatedDifficulty) {
    issues.push('estimatedDifficulty is required as a short string.');
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
  const lengthConfig = lengthConfigs[input.length];
  const threshold = qualityThresholdsByLength[input.length];
  const topicLabel = getTopicLabel(input.topic);
  const objectiveLabel = getObjectiveLabel(input.objective);
  const technicalVocabularyRequired = requiresTechnicalVocabulary(input.topic, input.objective);
  const supportHint = input.learningSupport
    ? `Spanish hints: ${input.learningSupport.spanishHints}. Blanks mode: ${input.learningSupport.blanksMode}.`
    : 'Spanish hints: off. Blanks mode: off.';
  const weakWords = input.useWeakWords ? input.weakWords ?? [] : [];
  const weakWordsSection = weakWords.length > 0
    ? `Naturally include these learner weak words when possible: ${weakWords.join(', ')}. Do not list them separately in the main text.`
    : input.useWeakWords
      ? 'The learner asked to use weak words, but no weak words were available. Generate normal practice text without mentioning this.'
      : 'Weak words are not requested.';
  const technicalSection = technicalVocabularyRequired
    ? 'Include technical vocabulary naturally and coherently. Keep it level-appropriate, especially for A1/A2.'
    : 'Do not force technical vocabulary unless it fits the topic naturally.';

  const retrySection =
    retryFeedback.length === 0
      ? ''
      : `Previous attempt issues: ${retryFeedback.map((issue, index) => `${index + 1}) ${issue}`).join(' ')}. Regenerate fixing every issue.`;

  return [
    'Create one cohesive typing-practice passage in plain English for a Spanish speaker learning English.',
    'The output is for typing practice, so it must be natural, coherent, and comfortable to type.',
    `CEFR level: ${input.cefrLevel}.`,
    `CEFR profile: vocabulary ${cefrConfig.vocabularyComplexity}, sentence structure ${cefrConfig.sentenceStructure}, grammar focus ${cefrConfig.grammarFocus.join(', ')}.`,
    `Topic: ${topicLabel}. Topic focus: ${getTopicPrompt(input.topic)}.`,
    `Practice objective: ${objectiveLabel}. Objective focus: ${getObjectivePrompt(input.objective)}.`,
    `Target length: ${lengthConfig.wordCount.min}-${lengthConfig.wordCount.max} words.`,
    `Quality minimums: at least ${threshold.minSentences} sentences and ${threshold.minUniqueWords} unique words.`,
    'The text must be grammatically correct and contextually coherent from beginning to end. Avoid repetitive robotic phrasing.',
    'For A1 and A2, use short sentences, common words, and simple punctuation. Avoid overly complex sentences.',
    'Do not include markdown. Do not include translations inside the main text. Do not include Spanish in the main text.',
    'Keep punctuation appropriate to the selected CEFR level.',
    weakWordsSection,
    technicalSection,
    supportHint,
    retrySection,
    'Return ONLY valid JSON with this schema:',
    '{"title": string, "text": string, "level": "A1"|"A2"|"B1"|"B2"|"C1", "topic": string, "objective": string, "keywordsUsed": string[], "estimatedDifficulty": string}',
    'Rules: strict JSON only, no markdown, no explanations, no additional keys. level, topic, and objective must match the request.',
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
              'You generate plain-English ESL typing practice for Spanish speakers. Follow CEFR level, topic, objective, weak-word, technical-vocabulary, and length constraints exactly. Output strict JSON only.',
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
      title: generated.title || `${getTopicLabel(parsed.data.topic)} Practice`,
      text: generated.text,
      cefrLevel: parsed.data.cefrLevel,
      practiceGoal: parsed.data.practiceGoal,
      topic: parsed.data.topic,
      objective: parsed.data.objective,
      length: parsed.data.length,
      keyVocabulary: generated.keywordsUsed,
      keywordsUsed: generated.keywordsUsed,
      suggestedBlankWords: generated.suggestedBlankWords,
      estimatedDifficulty: generated.estimatedDifficulty,
      generationSource: 'ai',
      weakWordsUsed: parsed.data.useWeakWords ? parsed.data.weakWords ?? [] : [],
      technicalVocabularyUsed: requiresTechnicalVocabulary(parsed.data.topic, parsed.data.objective)
        ? generated.keywordsUsed?.slice(0, 8) ?? []
        : [],
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
