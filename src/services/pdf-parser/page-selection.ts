import { cleanSectionText, createSections, normalizeText } from './normalizer';
import type { ParsedPdf } from './index';

export type PageSelectionMode = 'include' | 'exclude';

export interface PageSelectionCriteria {
  mode: PageSelectionMode;
  pages: number[];
}

export interface PageSelectionError {
  code:
    | 'PAGE_SELECTION_INVALID_TOKEN'
    | 'PAGE_SELECTION_INVERTED_RANGE'
    | 'PAGE_SELECTION_OUT_OF_RANGE'
    | 'PAGE_SELECTION_EMPTY_EFFECTIVE';
  message: string;
}

export type PageRangeParseResult =
  | { success: true; pages: number[] }
  | { success: false; error: PageSelectionError };

export type PageSelectionResolveResult =
  | { success: true; effectivePages: number[]; normalizedPages: number[] }
  | { success: false; error: PageSelectionError };

const PAGE_TOKEN_REGEX = /^\d+(?:-\d+)?$/;

function makeSortedUnique(pages: number[]): number[] {
  return [...new Set(pages)].sort((a, b) => a - b);
}

function getOutOfRangeError(pageNumber: number, maxPage: number): PageSelectionError {
  return {
    code: 'PAGE_SELECTION_OUT_OF_RANGE',
    message: `Page ${pageNumber} is out of range. Allowed pages are 1-${maxPage}.`,
  };
}

export function parsePageRangeInput(input: string, maxPage: number): PageRangeParseResult {
  if (maxPage < 1) {
    return {
      success: false,
      error: {
        code: 'PAGE_SELECTION_OUT_OF_RANGE',
        message: 'No pages available for selection.',
      },
    };
  }

  const trimmed = input.trim();

  if (!trimmed) {
    return { success: true, pages: [] };
  }

  const tokens = trimmed.split(',').map((token) => token.trim());
  const pages: number[] = [];

  for (const token of tokens) {
    if (!token || !PAGE_TOKEN_REGEX.test(token)) {
      return {
        success: false,
        error: {
          code: 'PAGE_SELECTION_INVALID_TOKEN',
          message: `Invalid token "${token || '(empty)'}". Use formats like "4" or "2-6".`,
        },
      };
    }

    const [rawStart, rawEnd] = token.split('-');
    const start = Number(rawStart);
    const end = rawEnd ? Number(rawEnd) : start;

    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
      return {
        success: false,
        error: {
          code: 'PAGE_SELECTION_INVALID_TOKEN',
          message: `Invalid page token "${token}". Page numbers must be positive integers.`,
        },
      };
    }

    if (start > end) {
      return {
        success: false,
        error: {
          code: 'PAGE_SELECTION_INVERTED_RANGE',
          message: `Invalid range "${token}". Range start cannot be greater than end.`,
        },
      };
    }

    if (start > maxPage) {
      return { success: false, error: getOutOfRangeError(start, maxPage) };
    }

    if (end > maxPage) {
      return { success: false, error: getOutOfRangeError(end, maxPage) };
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
  }

  return { success: true, pages: makeSortedUnique(pages) };
}

export function resolvePageSelection(
  criteria: PageSelectionCriteria,
  totalPages: number
): PageSelectionResolveResult {
  if (totalPages < 1) {
    return {
      success: false,
      error: {
        code: 'PAGE_SELECTION_OUT_OF_RANGE',
        message: 'No pages available for selection.',
      },
    };
  }

  for (const page of criteria.pages) {
    if (!Number.isInteger(page) || page < 1 || page > totalPages) {
      return {
        success: false,
        error: getOutOfRangeError(page, totalPages),
      };
    }
  }

  const normalizedPages = makeSortedUnique(criteria.pages);
  const excludedPages = new Set(normalizedPages);

  const effectivePages =
    criteria.mode === 'include'
      ? normalizedPages
      : Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => !excludedPages.has(page));

  if (effectivePages.length === 0) {
    return {
      success: false,
      error: {
        code: 'PAGE_SELECTION_EMPTY_EFFECTIVE',
        message:
          criteria.mode === 'include'
            ? 'Include mode requires at least one selected page.'
            : 'Exclude mode cannot remove all pages. Keep at least one page enabled.',
      },
    };
  }

  return {
    success: true,
    effectivePages,
    normalizedPages,
  };
}

export function applyPageSelectionToParsedPdf(
  sourcePdf: ParsedPdf,
  criteria: PageSelectionCriteria
): { success: true; data: ParsedPdf } | { success: false; error: PageSelectionError } {
  const resolved = resolvePageSelection(criteria, sourcePdf.pageCount);

  if (!resolved.success) {
    return {
      success: false,
      error: resolved.error,
    };
  }

  const pageSet = new Set(resolved.effectivePages);

  const selectedTextByPage = sourcePdf.textByPage.filter((page) => pageSet.has(page.pageNumber));
  const rawText = selectedTextByPage.map((page) => page.text).join('\n');
  const normalizedText = normalizeText(rawText);
  const cleanedText = cleanSectionText(normalizedText);

  return {
    success: true,
    data: {
      ...sourcePdf,
      textByPage: selectedTextByPage,
      allText: cleanedText,
      sections: createSections(cleanedText),
      effectivePageNumbers: resolved.effectivePages,
      selectedPageCount: resolved.effectivePages.length,
    },
  };
}
