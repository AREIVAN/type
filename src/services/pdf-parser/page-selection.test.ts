import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyPageSelectionToParsedPdf,
  parsePageRangeInput,
  resolvePageSelection,
  type PageSelectionCriteria,
} from './page-selection';

function makeParsedPdf() {
  return {
    name: 'sample.pdf',
    pageCount: 5,
    textByPage: [
      { pageNumber: 1, text: 'First page text.' },
      { pageNumber: 2, text: 'Second page text.' },
      { pageNumber: 3, text: 'Third page text.' },
      { pageNumber: 4, text: 'Fourth page text.' },
      { pageNumber: 5, text: 'Fifth page text.' },
    ],
    allText: 'First page text.\nSecond page text.\nThird page text.\nFourth page text.\nFifth page text.',
    sections: [],
    selectedPageCount: 5,
    effectivePageNumbers: [1, 2, 3, 4, 5],
  };
}

test('parses valid range/list syntax with dedup and sorting', () => {
  const parsed = parsePageRangeInput('1-3, 5, 3, 2, 8-10', 10);

  assert.equal(parsed.success, true);
  if (!parsed.success) return;

  assert.deepEqual(parsed.pages, [1, 2, 3, 5, 8, 9, 10]);
});

test('returns detailed error for invalid token', () => {
  const parsed = parsePageRangeInput('1-3,foo,7', 10);

  assert.equal(parsed.success, false);
  if (parsed.success) return;

  assert.equal(parsed.error.code, 'PAGE_SELECTION_INVALID_TOKEN');
  assert.match(parsed.error.message, /foo/);
});

test('returns detailed error for inverted range', () => {
  const parsed = parsePageRangeInput('5-3', 10);

  assert.equal(parsed.success, false);
  if (parsed.success) return;

  assert.equal(parsed.error.code, 'PAGE_SELECTION_INVERTED_RANGE');
});

test('returns out-of-range error for pages above max', () => {
  const parsed = parsePageRangeInput('1,12', 10);

  assert.equal(parsed.success, false);
  if (parsed.success) return;

  assert.equal(parsed.error.code, 'PAGE_SELECTION_OUT_OF_RANGE');
  assert.match(parsed.error.message, /1-10/);
});

test('resolve include and exclude modes correctly', () => {
  const includeCriteria: PageSelectionCriteria = { mode: 'include', pages: [4, 2, 2] };
  const excludeCriteria: PageSelectionCriteria = { mode: 'exclude', pages: [2, 4] };

  const included = resolvePageSelection(includeCriteria, 5);
  const excluded = resolvePageSelection(excludeCriteria, 5);

  assert.equal(included.success, true);
  if (included.success) {
    assert.deepEqual(included.effectivePages, [2, 4]);
  }

  assert.equal(excluded.success, true);
  if (excluded.success) {
    assert.deepEqual(excluded.effectivePages, [1, 3, 5]);
  }
});

test('applyPageSelectionToParsedPdf updates final text and sections', () => {
  const parsedPdf = makeParsedPdf();

  const result = applyPageSelectionToParsedPdf(parsedPdf, { mode: 'include', pages: [2, 4] });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.equal(result.data.selectedPageCount, 2);
  assert.deepEqual(result.data.effectivePageNumbers, [2, 4]);
  assert.deepEqual(
    result.data.textByPage.map((page) => page.pageNumber),
    [2, 4]
  );
  assert.match(result.data.allText, /Second page text/);
  assert.match(result.data.allText, /Fourth page text/);
  assert.doesNotMatch(result.data.allText, /First page text/);
  assert.ok(result.data.sections.length > 0);
});

test('exclude mode cannot remove every page', () => {
  const parsedPdf = makeParsedPdf();

  const result = applyPageSelectionToParsedPdf(parsedPdf, {
    mode: 'exclude',
    pages: [1, 2, 3, 4, 5],
  });

  assert.equal(result.success, false);
  if (result.success) return;

  assert.equal(result.error.code, 'PAGE_SELECTION_EMPTY_EFFECTIVE');
});
