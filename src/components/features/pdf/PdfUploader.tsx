'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';
import { cn } from '@/utils/cn';
import { parsePdf, isLikelyPdfFile } from '@/services/pdf-parser';
import type { ParseResult, ParseError, ParseProgress, ParsePageContentProgress } from '@/services/pdf-parser';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { buildPageProgressTiles, buildVisiblePageProgressItems } from './parse-progress-state';

interface PdfUploaderProps {
  onUpload: (file: File, result: ParseResult) => void;
  onProgressChange?: (progress: ParseProgress | null) => void;
}

export function PdfUploader({ onUpload, onProgressChange }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ParseError | null>(null);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [failedOrder, setFailedOrder] = useState<number | null>(null);
  const [orderToSourcePage, setOrderToSourcePage] = useState<Map<number, number>>(new Map());
  const [pageContentByOrder, setPageContentByOrder] = useState<Map<number, string>>(new Map());

  const lastProgressRef = useRef<ParseProgress | null>(null);

  const ratio = progress ? Math.max(0, Math.min(1, progress.current / progress.total)) : 0;
  const percent = Math.round(ratio * 100);

  const pageTiles = useMemo(
    () =>
      buildPageProgressTiles(progress, {
        isProcessing: isLoading,
        errorOrder: failedOrder,
        orderToSourcePage,
      }),
    [failedOrder, isLoading, orderToSourcePage, progress]
  );

  const pageTileItems = useMemo(
    () => buildVisiblePageProgressItems(pageTiles, progress?.current ?? 1),
    [pageTiles, progress]
  );

  const pageContentItems = useMemo(
    () =>
      pageTileItems.flatMap((item) => {
        if (item.type !== 'tile') {
          return [];
        }

        return [
          {
            tile: item.tile,
            text: pageContentByOrder.get(item.tile.order),
          },
        ];
      }),
    [pageContentByOrder, pageTileItems]
  );

  const getPreviewText = useCallback((contentProgress: ParsePageContentProgress) => {
    const normalized = contentProgress.text.replace(/\s+/g, ' ').trim();
    return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!isLikelyPdfFile(file)) {
      setError({
        type: 'type-error',
        code: 'PDF_INVALID_TYPE',
        message: 'Please upload a valid PDF file (.pdf).',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setFailedOrder(null);
    setProgress(null);
    setOrderToSourcePage(new Map());
    setPageContentByOrder(new Map());
    lastProgressRef.current = null;
    onProgressChange?.(null);

    try {
      const result = await parsePdf(file, {
        onPageContent: (contentProgress) => {
          setOrderToSourcePage((currentMap) => {
            const nextMap = new Map(currentMap);
            nextMap.set(contentProgress.current, contentProgress.pageNumber);
            return nextMap;
          });
          setPageContentByOrder((currentMap) => {
            const nextMap = new Map(currentMap);
            nextMap.set(contentProgress.current, getPreviewText(contentProgress));
            return nextMap;
          });
        },
        onProgress: (nextProgress) => {
          setOrderToSourcePage((currentMap) => {
            const nextMap = new Map(currentMap);
            nextMap.set(nextProgress.current, nextProgress.pageNumber);
            return nextMap;
          });
          lastProgressRef.current = nextProgress;
          setProgress(nextProgress);
          onProgressChange?.(nextProgress);
        },
      });
      if (result.success) {
        onUpload(file, result);
      } else {
        const lastProgress = lastProgressRef.current as ParseProgress | null;
        const failedCurrent = lastProgress ? lastProgress.current : null;
        if (failedCurrent !== null) {
          setFailedOrder(failedCurrent);
        }
        setError(result.error);
      }
    } catch {
      const lastProgress = lastProgressRef.current as ParseProgress | null;
      const failedCurrent = lastProgress ? lastProgress.current : null;
      if (failedCurrent !== null) {
        setFailedOrder(failedCurrent);
      }
      setError({
        type: 'read-error',
        code: 'PDF_READ_FAILED',
        message: 'Failed to process PDF. Please try again.',
      });
    } finally {
      setIsLoading(false);
      onProgressChange?.(null);
    }
  }, [getPreviewText, onProgressChange, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-12',
          'transition-all duration-300 cursor-pointer',
          isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50',
          isLoading && 'pointer-events-none opacity-50'
        )}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center text-center">
          {isLoading ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-zinc-300 font-medium">
                {progress ? `Processing page ${progress.current} of ${progress.total}` : 'Processing PDF...'}
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                {progress ? `Current source page: ${progress.pageNumber}` : 'Extracting text and creating sections'}
              </p>
              {progress && (
                <div className="mt-4 w-full max-w-xs">
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
                    role="progressbar"
                    aria-label="PDF parsing progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                  >
                    <div
                      className="h-full origin-left rounded-full bg-blue-500 transition-transform duration-500 ease-out motion-reduce:transition-none"
                      style={{ transform: `scaleX(${ratio})` }}
                    />
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-zinc-500">{percent}% complete</p>
                </div>
              )}
              {pageTileItems.length > 0 && (
                <div className="mt-4 w-full max-w-md" aria-live="polite" aria-atomic="false">
                  <ul className="flex flex-wrap items-center gap-1.5">
                    {pageTileItems.map((item) => {
                      if (item.type === 'gap') {
                        return (
                          <li key={item.id} className="px-1 text-xs text-zinc-600" aria-hidden="true">
                            ...
                          </li>
                        );
                      }

                      const tile = item.tile;
                      const isCurrent = tile.order === progress?.current;
                      const tileLabel = `Page ${tile.sourcePageNumber}: ${tile.status}`;

                      return (
                        <li key={`progress-page-${tile.order}`}>
                          <div
                            aria-label={tileLabel}
                            className={cn(
                              'flex min-w-16 items-center justify-center gap-1 rounded-md border px-2 py-1 text-[11px] tabular-nums',
                              'transition-colors transition-shadow duration-300 ease-out motion-reduce:transition-none',
                              tile.status === 'done' &&
                                'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
                              tile.status === 'processing' &&
                                'border-blue-400/60 bg-blue-500/15 text-blue-100 shadow-[0_0_0_1px_rgba(59,130,246,0.2)] motion-safe:animate-pulse motion-reduce:animate-none',
                              tile.status === 'pending' && 'border-zinc-700/80 bg-zinc-900/70 text-zinc-400',
                              tile.status === 'error' && 'border-red-500/40 bg-red-500/10 text-red-200',
                              isCurrent && tile.status !== 'error' && 'ring-1 ring-blue-400/40'
                            )}
                          >
                            <span>{tile.sourcePageNumber}</span>
                            {tile.status === 'done' && (
                              <CheckCircle2
                                className="h-3.5 w-3.5 text-emerald-300 transition-transform duration-200 ease-out motion-reduce:transition-none"
                                aria-hidden="true"
                              />
                            )}
                            {tile.status === 'processing' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                            {tile.status === 'error' && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {pageContentItems.length > 0 && (
                <div className="mt-4 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2" aria-live="polite" aria-atomic="false">
                  {pageContentItems.map(({ tile, text }) => (
                    <article
                      key={`progress-page-content-${tile.order}`}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-left',
                        tile.status === 'done' && 'border-emerald-500/30 bg-emerald-500/10',
                        tile.status === 'processing' && 'border-blue-400/60 bg-blue-500/10',
                        tile.status === 'pending' && 'border-zinc-800 bg-zinc-900/60',
                        tile.status === 'error' && 'border-red-500/40 bg-red-500/10'
                      )}
                    >
                      <p className="text-xs font-medium text-zinc-300">Page {tile.sourcePageNumber}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {text ?? (tile.status === 'pending' ? 'Waiting for extraction...' : 'Extracting text...')}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                isDragging ? 'bg-blue-500/20' : 'bg-zinc-800'
              )}>
                {isDragging ? (
                  <FileText className="w-8 h-8 text-blue-400" />
                ) : (
                  <Upload className="w-8 h-8 text-zinc-400" />
                )}
              </div>
              <p className="text-zinc-300 font-medium">
                {isDragging ? 'Drop your PDF here' : 'Drag and drop your PDF'}
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                or click to browse files
              </p>
              <p className="text-zinc-600 text-xs mt-3">
                Supports text-based PDFs up to 50MB
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <ErrorBanner
          type="error"
          title="Upload failed"
          message={`${error.message} (${error.code})${error.details ? `: ${error.details}` : ''}`}
          action={{
            label: 'Try Again',
            onClick: () => setError(null),
          }}
          className="mt-4"
        />
      )}

      <div className="mt-8 text-center">
        <p className="text-zinc-500 text-sm">
          <span className="text-zinc-400">Tip:</span> For best results, use PDFs with selectable text.
          Scanned documents may not work.
        </p>
      </div>
    </div>
  );
}
