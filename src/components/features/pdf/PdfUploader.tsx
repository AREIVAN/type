'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { parsePdf, ParseResult } from '@/services/pdf-parser';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

interface PdfUploaderProps {
  onUpload: (result: ParseResult) => void;
}

export function PdfUploader({ onUpload }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await parsePdf(file);
      if (result.success) {
        onUpload(result);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Failed to process PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onUpload]);

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
              <p className="text-zinc-300 font-medium">Processing PDF...</p>
              <p className="text-zinc-500 text-sm mt-1">Extracting text and creating sections</p>
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
          message={error}
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