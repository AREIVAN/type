export interface PdfTextItemLike {
  str?: string;
}

interface PdfRenderTaskLike {
  promise: Promise<void>;
  cancel?: () => void;
}

interface PdfViewportLike {
  width: number;
  height: number;
}

export interface PdfPageLike {
  getTextContent: () => Promise<{ items: PdfTextItemLike[] }>;
  getViewport?: (options: { scale: number }) => PdfViewportLike;
  render?: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewportLike;
    canvas?: HTMLCanvasElement;
  }) => PdfRenderTaskLike;
}

export interface PdfDocumentLike {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageLike>;
  destroy?: () => Promise<void> | void;
}

interface PdfLoadingTaskLike {
  promise: Promise<PdfDocumentLike>;
}

export interface PdfJsLike {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument: (options: { data: ArrayBuffer; disableWorker?: boolean }) => PdfLoadingTaskLike;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === 'string') return error;

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return 'Unknown PDF error';
}

export function isWorkerError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    /worker/.test(message) ||
    /importscript/.test(message) ||
    /fake worker/.test(message) ||
    /failed to fetch dynamically imported module/.test(message) ||
    /networkerror/.test(message)
  );
}

export function getLocalWorkerSrc(): string {
  return new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
}

export function ensureWorkerSrc(pdfjsLib: PdfJsLike): void {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = getLocalWorkerSrc();
  }
}

export async function loadPdfJs(): Promise<PdfJsLike> {
  return (import('pdfjs-dist') as unknown) as Promise<PdfJsLike>;
}

export async function openPdfDocument(
  data: ArrayBuffer,
  options: { loadPdfJs?: () => Promise<PdfJsLike> } = {}
): Promise<PdfDocumentLike> {
  const pdfLoader = options.loadPdfJs ?? loadPdfJs;
  const pdfjsLib = await pdfLoader();
  ensureWorkerSrc(pdfjsLib);

  try {
    return await pdfjsLib.getDocument({ data }).promise;
  } catch (error) {
    if (!isWorkerError(error)) {
      throw error;
    }

    return pdfjsLib.getDocument({ data, disableWorker: true }).promise;
  }
}
