import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePdf, type ParseResult } from './index';

type PdfDocumentMock = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: string }> }> }>;
  destroy: () => Promise<void>;
};

function makePdfFile(name = 'sample.pdf'): File {
  return new File([new Uint8Array([37, 80, 68, 70])], name, {
    type: 'application/pdf',
  });
}

function makePdfDocument(pages: string[]): PdfDocumentMock {
  return {
    numPages: pages.length,
    async getPage(pageNumber: number) {
      const text = pages[pageNumber - 1] ?? '';

      return {
        async getTextContent() {
          return {
            items: text
              ? text.split(' ').map((str) => ({ str }))
              : [],
          };
        },
      };
    },
    async destroy() {},
  };
}

function getError(result: ParseResult) {
  assert.equal(result.success, false);
  return result.error;
}

test('parses a valid text PDF successfully', async () => {
  const file = makePdfFile();

  const result = await parsePdf(file, {
    loadPdfJs: async () => ({
      GlobalWorkerOptions: { workerSrc: '' },
      getDocument: () => ({ promise: Promise.resolve(makePdfDocument(['hello world'])) }),
    }),
  });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.equal(result.data.pageCount, 1);
  assert.equal(result.data.textByPage[0]?.text, 'hello world');
  assert.match(result.data.allText, /hello world/);
});

test('falls back to main thread when worker initialization fails', async () => {
  const file = makePdfFile();

  const result = await parsePdf(file, {
    loadPdfJs: async () => ({
      GlobalWorkerOptions: { workerSrc: '' },
      getDocument: ({ disableWorker }) => {
        if (!disableWorker) {
          return {
            promise: Promise.reject(new Error('Setting up fake worker failed: worker script unreachable')),
          };
        }

        return { promise: Promise.resolve(makePdfDocument(['fallback text works'])) };
      },
    }),
  });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.match(result.data.allText, /fallback text works/);
});

test('returns actionable worker/load error when pdf.js fails to load', async () => {
  const file = makePdfFile();

  const result = await parsePdf(file, {
    loadPdfJs: async () => {
      throw new Error('Failed to fetch dynamically imported module');
    },
  });

  const error = getError(result);
  assert.equal(error.type, 'worker-error');
  assert.equal(error.code, 'PDFJS_LOAD_ERROR');
});

test('returns protected error for password-locked PDFs', async () => {
  const file = makePdfFile();

  const result = await parsePdf(file, {
    loadPdfJs: async () => ({
      GlobalWorkerOptions: { workerSrc: '' },
      getDocument: () => ({
        promise: Promise.reject({
          name: 'PasswordException',
          message: 'Password required or incorrect password.',
        }),
      }),
    }),
  });

  const error = getError(result);
  assert.equal(error.type, 'protected');
  assert.equal(error.code, 'PDF_PASSWORD_REQUIRED');
});

test('returns no-text error for scanned/image PDFs without selectable text', async () => {
  const file = makePdfFile();

  const result = await parsePdf(file, {
    loadPdfJs: async () => ({
      GlobalWorkerOptions: { workerSrc: '' },
      getDocument: () => ({ promise: Promise.resolve(makePdfDocument([''])) }),
    }),
  });

  const error = getError(result);
  assert.equal(error.type, 'no-text');
  assert.equal(error.code, 'PDF_NO_TEXT');
});

test('applies include page selection to final parsed payload', async () => {
  const file = makePdfFile();

  const result = await parsePdf(file, {
    pageSelection: { mode: 'include', pages: [2] },
    loadPdfJs: async () => ({
      GlobalWorkerOptions: { workerSrc: '' },
      getDocument: () => ({
        promise: Promise.resolve(makePdfDocument(['first content', 'selected second content', 'third content'])),
      }),
    }),
  });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.deepEqual(result.data.effectivePageNumbers, [2]);
  assert.equal(result.data.selectedPageCount, 1);
  assert.match(result.data.allText, /selected second content/);
  assert.doesNotMatch(result.data.allText, /first content/);
  assert.doesNotMatch(result.data.allText, /third content/);
});

test('invokes onProgress once per page in ascending order for full selection', async () => {
  const file = makePdfFile();
  const progressEvents: Array<{ current: number; total: number; pageNumber: number }> = [];

  const result = await parsePdf(file, {
    onProgress: (progress) => {
      progressEvents.push(progress);
    },
    loadPdfJs: async () => ({
      GlobalWorkerOptions: { workerSrc: '' },
      getDocument: () => ({
        promise: Promise.resolve(makePdfDocument(['p1 text', 'p2 text', 'p3 text'])),
      }),
    }),
  });

  assert.equal(result.success, true);
  assert.deepEqual(progressEvents, [
    { current: 1, total: 3, pageNumber: 1 },
    { current: 2, total: 3, pageNumber: 2 },
    { current: 3, total: 3, pageNumber: 3 },
  ]);
});

test('invokes onPageContent once per effective page with page text', async () => {
  const file = makePdfFile();
  const pageContentEvents: Array<{ current: number; total: number; pageNumber: number; text: string }> = [];

  const result = await parsePdf(file, {
    pageSelection: { mode: 'exclude', pages: [2] },
    onPageContent: (progress) => {
      pageContentEvents.push(progress);
    },
    loadPdfJs: async () => ({
      GlobalWorkerOptions: { workerSrc: '' },
      getDocument: () => ({
        promise: Promise.resolve(makePdfDocument(['first page text', 'second page text', 'third page text'])),
      }),
    }),
  });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.deepEqual(result.data.effectivePageNumbers, [1, 3]);
  assert.deepEqual(pageContentEvents, [
    { current: 1, total: 2, pageNumber: 1, text: 'first page text' },
    { current: 2, total: 2, pageNumber: 3, text: 'third page text' },
  ]);
});

test('invokes onProgress only for effective selected pages', async () => {
  const file = makePdfFile();
  const progressEvents: Array<{ current: number; total: number; pageNumber: number }> = [];

  const result = await parsePdf(file, {
    pageSelection: { mode: 'exclude', pages: [2, 4] },
    onProgress: (progress) => {
      progressEvents.push(progress);
    },
    loadPdfJs: async () => ({
      GlobalWorkerOptions: { workerSrc: '' },
      getDocument: () => ({
        promise: Promise.resolve(makePdfDocument(['p1 text', 'p2 text', 'p3 text', 'p4 text', 'p5 text'])),
      }),
    }),
  });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.deepEqual(result.data.effectivePageNumbers, [1, 3, 5]);
  assert.deepEqual(progressEvents, [
    { current: 1, total: 3, pageNumber: 1 },
    { current: 2, total: 3, pageNumber: 3 },
    { current: 3, total: 3, pageNumber: 5 },
  ]);
});
