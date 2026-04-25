import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampVerbCount,
  dedupeVerbItems,
  extractSubmittedVerbAnswer,
  fillWithFallbackItems,
  isCorrectVerbAnswer,
  isVerbAnswerComplete,
  isVerbPracticeTrack,
  mapVerbItemRanges,
  mapVerbTypingCharacters,
  normalizeVerbText,
  sanitizeVerbItems,
} from './helpers';
import { VerbPracticeItem } from '@/types';

const makeItem = (text: string, id = text): VerbPracticeItem => ({
  id,
  text,
  translationEs: `es-${text}`,
  track: 'A1',
});

test('validates tracks without treating technical engineering as CEFR', () => {
  assert.equal(isVerbPracticeTrack('A1'), true);
  assert.equal(isVerbPracticeTrack('technical-engineering'), true);
  assert.equal(isVerbPracticeTrack('engineering'), false);
});

test('clamps verb count to configured range', () => {
  assert.equal(clampVerbCount(0), 1);
  assert.equal(clampVerbCount(4.6), 5);
  assert.equal(clampVerbCount(99), 30);
});

test('normalizes and compares answers case-insensitively', () => {
  assert.equal(normalizeVerbText('  Deploy   Now '), 'deploy now');
  assert.equal(isCorrectVerbAnswer(' DEPLOY ', 'deploy'), true);
});

test('dedupes verb items by normalized English text', () => {
  const deduped = dedupeVerbItems([makeItem('Deploy', 'one'), makeItem(' deploy ', 'two'), makeItem('debug')]);

  assert.deepEqual(deduped.map(item => item.id), ['one', 'debug']);
});

test('extracts submitted verb answers from supported separators', () => {
  assert.deepEqual(extractSubmittedVerbAnswer('be '), { answer: 'be', remainder: '' });
  assert.deepEqual(extractSubmittedVerbAnswer('have·go'), { answer: 'have', remainder: 'go' });
  assert.deepEqual(extractSubmittedVerbAnswer('make.start'), { answer: 'make', remainder: 'start' });
  assert.equal(extractSubmittedVerbAnswer('learn'), null);
});

test('sanitizes AI items to single English verbs with Spanish translations', () => {
  const sanitized = sanitizeVerbItems(
    [
      { id: 'one', text: 'deploy', translationEs: 'desplegar', track: 'technical-engineering' },
      { id: 'two', text: 'shut down', translationEs: 'apagar', track: 'technical-engineering' },
    ],
    'technical-engineering'
  );

  assert.deepEqual(sanitized.map(item => item.text), ['deploy']);
});

test('fills with fallback items and caps to requested count', () => {
  const filled = fillWithFallbackItems([makeItem('custom')], 'A1', 3);

  assert.equal(filled.length, 3);
  assert.equal(filled[0].text, 'custom');
});

test('maps item ranges across newline-separated practice text', () => {
  const ranges = mapVerbItemRanges([makeItem('go', 'one'), makeItem('come', 'two')]);

  assert.deepEqual(ranges, [
    { itemId: 'one', start: 0, end: 2 },
    { itemId: 'two', start: 3, end: 7 },
  ]);
});

test('detects whether the current verb has been fully typed', () => {
  assert.equal(isVerbAnswerComplete('lea', 'learn'), false);
  assert.equal(isVerbAnswerComplete('learn', 'learn'), true);
  assert.equal(isVerbAnswerComplete('learnx', 'learn'), true);
});

test('maps character-level typing states for Monkeytype-style rendering', () => {
  assert.deepEqual(mapVerbTypingCharacters('learn', 'lea', { active: true }), [
    { character: 'l', status: 'correct' },
    { character: 'e', status: 'correct' },
    { character: 'a', status: 'correct' },
    { character: 'r', status: 'current' },
    { character: 'n', status: 'pending' },
  ]);

  assert.deepEqual(mapVerbTypingCharacters('go', 'Gx!'), [
    { character: 'g', status: 'correct' },
    { character: 'o', status: 'incorrect' },
    { character: '!', status: 'extra' },
  ]);
});
