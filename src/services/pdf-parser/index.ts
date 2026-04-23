import { PageSelectionCriteria, resolvePageSelection } from './page-selection';
import { cleanSectionText, createSections, normalizeText } from './normalizer';
import {
  loadPdfJs,
  openPdfDocument,
  isWorkerError,
  PdfDocumentLike,
  PdfJsLike,
  PdfTextItemLike,
} from './pdfjs';

export interface ParsedPdf {
  name: string;
  pageCount: number;
  textByPage: { pageNumber: number; text: string }[];
  allText: string;
  sections: { id: string; title: string; content: string }[];
  selectedPageCount: number;
  effectivePageNumbers: number[];
}

export interface ParseError {
  type:
    | 'empty'
    | 'no-text'
    | 'read-error'
    | 'size-error'
    | 'type-error'
    | 'worker-error'
    | 'protected'
    | 'selection-error';
  code:
    | 'PDF_EMPTY_FILE'
    | 'PDF_TOO_LARGE'
    | 'PDF_INVALID_TYPE'
    | 'PDF_NO_TEXT'
    | 'PDF_READ_FAILED'
    | 'PDF_WORKER_FAILED'
    | 'PDFJS_LOAD_ERROR'
    | 'PDF_PASSWORD_REQUIRED'
    | 'PDF_PAGE_SELECTION_INVALID';
  message: string;
  details?: string;
}

export type ParseResult = { success: true; data: ParsedPdf } | { success: false; error: ParseError };

export interface ParseProgress {
  current: number;
  total: number;
  pageNumber: number;
}

export interface ParsePageContentProgress extends ParseProgress {
  text: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
  'text/pdf',
]);

interface ParsePdfOptions {
  loadPdfJs?: () => Promise<PdfJsLike>;
  pageSelection?: PageSelectionCriteria;
  onProgress?: (progress: ParseProgress) => void;
  onPageContent?: (progress: ParsePageContentProgress) => void;
}

function getErrorName(error: unknown): string {
  if (error && typeof error === 'object' && 'name' in error && typeof error.name === 'string') {
    return error.name;
  }

  return 'Error';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === 'string') return error;

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return 'Unknown PDF parsing error';
}

function isPasswordError(error: unknown): boolean {
  const name = getErrorName(error);
  const message = getErrorMessage(error).toLowerCase();

  return name === 'PasswordException' || /password|encrypted|protected/.test(message);
}

function classifyReadError(error: unknown): ParseError {
  if (isPasswordError(error)) {
    return {
      type: 'protected',
      code: 'PDF_PASSWORD_REQUIRED',
      message: 'This PDF is password-protected. Please unlock it and try again.',
      details: getErrorMessage(error),
    };
  }

  if (isWorkerError(error)) {
    return {
      type: 'worker-error',
      code: 'PDF_WORKER_FAILED',
      message: 'PDF engine failed to start. Please refresh and try again.',
      details: getErrorMessage(error),
    };
  }

  return {
    type: 'read-error',
    code: 'PDF_READ_FAILED',
    message: 'Failed to read PDF content. The file may be corrupted or unsupported.',
    details: getErrorMessage(error),
  };
}

export function isLikelyPdfFile(file: Pick<File, 'name' | 'type'>): boolean {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return PDF_MIME_TYPES.has(mime) || name.endsWith('.pdf');
}

/**
 * Parse a PDF file and extract text (client-side only)
 */
export async function parsePdf(file: File, options: ParsePdfOptions = {}): Promise<ParseResult> {
  if (!isLikelyPdfFile(file)) {
    return {
      success: false,
      error: {
        type: 'type-error',
        code: 'PDF_INVALID_TYPE',
        message: 'Invalid file type. Please upload a .pdf file.',
      },
    };
  }

  if (file.size === 0) {
    return {
      success: false,
      error: {
        type: 'empty',
        code: 'PDF_EMPTY_FILE',
        message: 'The selected PDF is empty.',
      },
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: {
        type: 'size-error',
        code: 'PDF_TOO_LARGE',
        message: 'File is too large. Maximum size is 50MB.',
      },
    };
  }

  const pdfLoader = options.loadPdfJs ?? loadPdfJs;

  let pdf: PdfDocumentLike | undefined;

  try {
    const arrayBuffer = await file.arrayBuffer();
    pdf = await openPdfDocument(arrayBuffer, { loadPdfJs: pdfLoader });

    const pageCount = pdf.numPages;

    const requestedSelection =
      options.pageSelection ??
      ({
        mode: 'include',
        pages: Array.from({ length: pageCount }, (_, index) => index + 1),
      } satisfies PageSelectionCriteria);

    const resolvedSelection = resolvePageSelection(requestedSelection, pageCount);

    if (!resolvedSelection.success) {
      return {
        success: false,
        error: {
          type: 'selection-error',
          code: 'PDF_PAGE_SELECTION_INVALID',
          message: resolvedSelection.error.message,
          details: resolvedSelection.error.code,
        },
      };
    }

    const effectivePages = resolvedSelection.effectivePages;

    const textByPage: { pageNumber: number; text: string }[] = [];

    for (let index = 0; index < effectivePages.length; index += 1) {
      const pageNumber = effectivePages[index];
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: PdfTextItemLike) => item.str ?? '')
        .join(' ');

      textByPage.push({
        pageNumber,
        text: pageText,
      });

      options.onPageContent?.({
        current: index + 1,
        total: effectivePages.length,
        pageNumber,
        text: pageText,
      });

      options.onProgress?.({
        current: index + 1,
        total: effectivePages.length,
        pageNumber,
      });
    }

    const rawText = textByPage.map((page) => page.text).join('\n');
    const normalizedText = normalizeText(rawText);
    const cleanedText = cleanSectionText(normalizedText);
    const sections = createSections(cleanedText);

    if (cleanedText.length === 0) {
      return {
        success: false,
        error: {
          type: 'no-text',
          code: 'PDF_NO_TEXT',
          message: 'No selectable text found. This PDF may contain scanned images instead of text.',
        },
      };
    }

    return {
      success: true,
      data: {
        name: file.name,
        pageCount,
        textByPage,
        allText: cleanedText,
        sections,
        selectedPageCount: effectivePages.length,
        effectivePageNumbers: effectivePages,
      },
    };
  } catch (error) {
    if (isWorkerError(error)) {
      return {
        success: false,
        error: {
          type: 'worker-error',
          code: 'PDFJS_LOAD_ERROR',
          message: 'Unable to initialize PDF engine in this browser session. Please refresh and try again.',
          details: getErrorMessage(error),
        },
      };
    }

    return {
      success: false,
      error: classifyReadError(error),
    };
  } finally {
    await pdf?.destroy?.();
  }
}
