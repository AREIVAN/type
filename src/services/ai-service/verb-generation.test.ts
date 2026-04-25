import test from 'node:test';
import assert from 'node:assert/strict';

import { generateVerbPracticeItems } from './index';

test('generateVerbPracticeItems returns successful verb payload', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          items: [{ id: 'deploy', text: 'deploy', translationEs: 'desplegar', track: 'technical-engineering' }],
          source: 'fallback',
          requestedCount: 1,
          finalCount: 1,
          createdAt: new Date().toISOString(),
        },
      }),
      { status: 200 }
    );

  try {
    const result = await generateVerbPracticeItems({ count: 1, track: 'technical-engineering' });

    assert.equal(result.items[0].text, 'deploy');
    assert.equal(result.source, 'fallback');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('generateVerbPracticeItems surfaces API errors', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'Count must be between 1 and 30.', code: 'BAD_REQUEST' }), { status: 400 });

  try {
    await assert.rejects(
      () => generateVerbPracticeItems({ count: 31, track: 'A1' }),
      /Count must be between 1 and 30\./
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
