import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import {
  clampVerbCount,
  fillWithFallbackItems,
  isVerbPracticeTrack,
  isVerbPracticeType,
  sanitizeVerbItems,
} from '@/features/verb-practice/helpers';
import { GenerateVerbPracticeRequest, VerbPracticeItem } from '@/types';

export const runtime = 'nodejs';

type ApiErrorCode = 'BAD_REQUEST' | 'AI_BAD_RESPONSE' | 'FALLBACK_USED';

function jsonError(message: string, status: number, code: ApiErrorCode) {
  return NextResponse.json({ error: message, code }, { status });
}

function parseRequest(body: unknown): { ok: true; data: GenerateVerbPracticeRequest } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Invalid JSON body.' };
  }

  const record = body as Record<string, unknown>;
  if (!isVerbPracticeTrack(record.track)) {
    return { ok: false, error: 'Invalid verb practice track.' };
  }

  const count = Number(record.count);
  if (!Number.isFinite(count) || count < 1 || count > 30) {
    return { ok: false, error: 'Count must be between 1 and 30.' };
  }

  return {
    ok: true,
    data: {
      count: clampVerbCount(count),
      track: record.track,
      practiceType: isVerbPracticeType(record.practiceType) ? record.practiceType : 'base',
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

function parseAiItems(raw: string, track: GenerateVerbPracticeRequest['track']): VerbPracticeItem[] {
  try {
    const parsed = JSON.parse(stripCodeFence(raw)) as unknown;
    const items = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown }).items;
    return sanitizeVerbItems(items, track);
  } catch {
    return [];
  }
}

async function generateAiItems(request: GenerateVerbPracticeRequest): Promise<VerbPracticeItem[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return [];
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: 15_000,
    maxRetries: 0,
  });

  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant',
    temperature: 0.35,
    max_tokens: 900,
    messages: [
      {
        role: 'system',
        content: 'Generate English verb transcription practice items for Spanish-speaking ESL learners. Return strict JSON only.',
      },
      {
        role: 'user',
        content: [
          `Track: ${request.track}.`,
          `Count: ${request.count}.`,
          'Return JSON with shape: {"items":[{"text":"deploy","translationEs":"desplegar","track":"technical-engineering","example":"Deploy the app."}]}',
          'Rules: text must be one single-word English verb, translationEs must be Spanish, no duplicates, no phrases, no extra commentary.',
        ].join(' '),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  return raw ? parseAiItems(raw, request.track) : [];
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

  let aiItems: VerbPracticeItem[] = [];
  try {
    aiItems = await generateAiItems(parsed.data);
  } catch {
    aiItems = [];
  }

  const items = fillWithFallbackItems(aiItems, parsed.data.track, parsed.data.count, [], parsed.data.practiceType ?? 'base');
  const source = aiItems.length >= parsed.data.count ? 'ai' : 'fallback';

  if (items.length === 0) {
    return jsonError('No verb practice items are available for this track.', 502, 'AI_BAD_RESPONSE');
  }

  return NextResponse.json({
    data: {
      items,
      source,
      requestedCount: parsed.data.count,
      finalCount: items.length,
      createdAt: new Date().toISOString(),
    },
    error: items.length < parsed.data.count ? 'Requested count was capped to available unique items.' : undefined,
    code: items.length < parsed.data.count ? 'FALLBACK_USED' : undefined,
  });
}
