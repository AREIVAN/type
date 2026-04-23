'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import {
  type PageSelectionCriteria,
  type PageSelectionMode,
  parsePageRangeInput,
  resolvePageSelection,
} from '@/services/pdf-parser/page-selection';
import { openPdfDocument, type PdfDocumentLike } from '@/services/pdf-parser/pdfjs';
import { cn } from '@/utils/cn';

interface PdfPageSelectorProps {
  file: File;
  totalPages: number;
  onSelectionChange: (criteria: PageSelectionCriteria) => void;
}

interface ThumbnailTileProps {
  pdfDocument: PdfDocumentLike;
  pageNumber: number;
  isActive: boolean;
  mode: PageSelectionMode;
  onToggle: (pageNumber: number) => void;
}

function ThumbnailTile({ pdfDocument, pageNumber, isActive, mode, onToggle }: ThumbnailTileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasStartedRenderRef = useRef(false);
  const [shouldRender, setShouldRender] = useState(() => typeof IntersectionObserver === 'undefined');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!shouldRender || thumbnailUrl || error || hasStartedRenderRef.current) return;

    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | number | undefined;

    hasStartedRenderRef.current = true;

    const renderThumbnail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const page = await pdfDocument.getPage(pageNumber);

        if (!page.getViewport || !page.render) {
          throw new Error('PDF rendering is not available for this page.');
        }

        const baseViewport = page.getViewport({ scale: 1 });
        const desiredWidth = 220;
        const scale = Math.max(0.1, desiredWidth / baseViewport.width);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Unable to render thumbnail canvas context.');
        }

        const renderTask = page.render({ canvasContext: context, viewport, canvas });
        timeoutId = window.setTimeout(() => {
          if (!isCancelled) {
            setError('Preview rendering timed out. Try scrolling or reloading the page.');
            setIsLoading(false);
          }

          renderTask.cancel?.();
        }, 12000);

        await renderTask.promise;

        if (isCancelled) return;

        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }

        setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.8));
      } catch (thumbnailError) {
        if (!isCancelled) {
          setError(thumbnailError instanceof Error ? thumbnailError.message : 'Failed to render thumbnail.');
        }
      } finally {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }

        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void renderThumbnail();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [shouldRender, thumbnailUrl, error, pdfDocument, pageNumber]);

  const cardLabel =
    mode === 'include'
      ? isActive
        ? `Page ${pageNumber} selected for processing`
        : `Page ${pageNumber} not selected`
      : isActive
        ? `Page ${pageNumber} kept for processing`
        : `Page ${pageNumber} excluded from processing`;

  return (
    <button
      type="button"
      onClick={() => onToggle(pageNumber)}
      aria-pressed={isActive}
      aria-label={cardLabel}
      className={cn(
        'group relative rounded-xl border p-2 text-left transition-colors',
        isActive
          ? 'border-blue-500/70 bg-blue-500/10'
          : mode === 'exclude'
            ? 'border-zinc-800 bg-zinc-900/40'
            : 'border-zinc-800 bg-zinc-900/50',
        !isActive && mode === 'exclude' && 'opacity-60'
      )}
    >
      <div ref={containerRef} className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-950">
        {isLoading && (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt={`PDF page ${pageNumber} thumbnail`}
            width={220}
            height={300}
            unoptimized
            className={cn('h-full w-full object-cover transition-opacity duration-200', !isActive && 'opacity-65')}
          />
        )}

        {!isLoading && !error && !thumbnailUrl && shouldRender && (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-500">
            Preview unavailable
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-300">Page {pageNumber}</span>
        {isActive ? (
          <CheckCircle2 className="h-4 w-4 text-blue-400" aria-hidden="true" />
        ) : (
          <XCircle className="h-4 w-4 text-zinc-600" aria-hidden="true" />
        )}
      </div>
    </button>
  );
}

export function PdfPageSelector({ file, totalPages, onSelectionChange }: PdfPageSelectorProps) {
  const [mode, setMode] = useState<PageSelectionMode>('include');
  const [manualRange, setManualRange] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(
    new Set(Array.from({ length: totalPages }, (_, index) => index + 1))
  );
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<PdfDocumentLike | null>(null);

  const docRef = useRef<PdfDocumentLike | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadDocument = async () => {
      setIsDocumentLoading(true);
      setDocumentError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const document = await openPdfDocument(arrayBuffer);

        if (isCancelled) {
          await document.destroy?.();
          return;
        }

        await docRef.current?.destroy?.();
        docRef.current = document;
        setPdfDocument(document);
      } catch (error) {
        if (!isCancelled) {
          setPdfDocument(null);
          setDocumentError(error instanceof Error ? error.message : 'Unable to load PDF preview.');
        }
      } finally {
        if (!isCancelled) {
          setIsDocumentLoading(false);
        }
      }
    };

    void loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  useEffect(() => {
    return () => {
      void docRef.current?.destroy?.();
      docRef.current = null;
    };
  }, []);

  const criteria = useMemo<PageSelectionCriteria>(
    () => ({ mode, pages: [...selectedPages].sort((a, b) => a - b) }),
    [mode, selectedPages]
  );

  const resolvedSelection = useMemo(() => resolvePageSelection(criteria, totalPages), [criteria, totalPages]);

  useEffect(() => {
    onSelectionChange(criteria);
  }, [criteria, onSelectionChange]);

  const handleTogglePage = useCallback((pageNumber: number) => {
    setSelectedPages((current) => {
      const next = new Set(current);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }

      return next;
    });
  }, []);

  const handleApplyRange = useCallback(() => {
    const parsed = parsePageRangeInput(manualRange, totalPages);

    if (!parsed.success) {
      setManualError(parsed.error.message);
      return;
    }

    setManualError(null);
    setSelectedPages(new Set(parsed.pages));
  }, [manualRange, totalPages]);

  const handleModeChange = useCallback((nextMode: PageSelectionMode) => {
    setMode(nextMode);
    setManualRange('');
    setManualError(null);
    setSelectedPages(
      nextMode === 'include'
        ? new Set(Array.from({ length: totalPages }, (_, index) => index + 1))
        : new Set<number>()
    );
  }, [totalPages]);

  const clearSelection = useCallback(() => {
    setManualRange('');
    setManualError(null);
    setSelectedPages(new Set<number>());
  }, []);

  const setAllPages = useCallback(() => {
    setManualRange('');
    setManualError(null);
    setSelectedPages(new Set(Array.from({ length: totalPages }, (_, index) => index + 1)));
  }, [totalPages]);

  const activePageSet = useMemo(() => {
    if (!resolvedSelection.success) {
      return new Set<number>();
    }

    return new Set(resolvedSelection.effectivePages);
  }, [resolvedSelection]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Page selection</h3>
            <p className="text-sm text-zinc-400">Use include/exclude mode, manual ranges, or click thumbnails.</p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950/60 p-1">
            <Button
              type="button"
              variant={mode === 'include' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('include')}
              aria-pressed={mode === 'include'}
            >
              Include
            </Button>
            <Button
              type="button"
              variant={mode === 'exclude' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('exclude')}
              aria-pressed={mode === 'exclude'}
            >
              Exclude
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={manualRange}
            onChange={(event) => setManualRange(event.target.value)}
            placeholder="1-3,5,8-10"
            aria-label="Manual page range"
            className="min-w-52 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleApplyRange}>
            Apply range
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={setAllPages}>
            All pages
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        </div>

        {manualError && <p className="text-sm text-red-300">{manualError}</p>}

        {!manualError && !resolvedSelection.success && (
          <p className="text-sm text-red-300">{resolvedSelection.error.message}</p>
        )}

        {resolvedSelection.success && (
          <p className="text-sm text-zinc-400">
            Effective pages to process: <span className="font-semibold text-zinc-100">{resolvedSelection.effectivePages.length}</span> / {totalPages}
          </p>
        )}

        {isDocumentLoading && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading visual previews...
          </div>
        )}

        {documentError && <p className="text-sm text-red-300">Preview failed: {documentError}</p>}

        {pdfDocument && !documentError && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;

              return (
                <ThumbnailTile
                  key={`pdf-page-${pageNumber}`}
                  pdfDocument={pdfDocument}
                  pageNumber={pageNumber}
                  isActive={activePageSet.has(pageNumber)}
                  mode={mode}
                  onToggle={handleTogglePage}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
