import test from 'node:test';
import assert from 'node:assert/strict';

import { applyTypingCorrection, TypingEngineState } from './useTypingEngine';

const makeState = (overrides: Partial<TypingEngineState> = {}): TypingEngineState => ({
  characters: [
    { char: 'a', status: 'correct' },
    { char: 'b', status: 'incorrect' },
    { char: 'c', status: 'current' },
  ],
  currentIndex: 2,
  status: 'active',
  metrics: {
    wpm: 24,
    accuracy: 50,
    errors: 1,
    correctChars: 1,
    totalChars: 3,
    time: 1,
  },
  ...overrides,
});

test('typing correction moves back and removes an incorrect character from metrics', () => {
  const next = applyTypingCorrection(makeState(), 'abc', 2);

  assert.equal(next.currentIndex, 1);
  assert.equal(next.characters[1].status, 'current');
  assert.equal(next.characters[2].status, 'pending');
  assert.equal(next.metrics.errors, 0);
  assert.equal(next.metrics.correctChars, 1);
  assert.equal(next.metrics.accuracy, 100);
});

test('typing correction removes a correct character from metrics', () => {
  const next = applyTypingCorrection(
    makeState({
      characters: [
        { char: 'a', status: 'correct' },
        { char: 'b', status: 'current' },
        { char: 'c', status: 'pending' },
      ],
      currentIndex: 1,
      metrics: {
        wpm: 24,
        accuracy: 100,
        errors: 0,
        correctChars: 1,
        totalChars: 3,
        time: 1,
      },
    }),
    'abc',
    2
  );

  assert.equal(next.currentIndex, 0);
  assert.equal(next.characters[0].status, 'current');
  assert.equal(next.characters[1].status, 'pending');
  assert.equal(next.metrics.errors, 0);
  assert.equal(next.metrics.correctChars, 0);
  assert.equal(next.metrics.accuracy, 100);
});

test('typing correction is a no-op at the beginning', () => {
  const state = makeState({ currentIndex: 0 });

  assert.equal(applyTypingCorrection(state, 'abc', 2), state);
});
