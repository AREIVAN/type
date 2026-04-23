'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PdfUploader } from '@/components/features/pdf/PdfUploader';
import { PdfPageSelector } from '@/components/features/pdf/PdfPageSelector';
import { SectionSelector } from '@/components/features/pdf/SectionSelector';
import { ParseProgress, ParseResult, ParsedPdf } from '@/services/pdf-parser';
import { applyPageSelectionToParsedPdf, PageSelectionCriteria } from '@/services/pdf-parser/page-selection';
import Link from 'next/link';

export default function PdfPage() {
  const router = useRouter();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceParsedData, setSourceParsedData] = useState<ParsedPdf | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPdf | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);

  const handleUpload = useCallback((file: File, result: ParseResult) => {
    if (result.success) {
      setSourceFile(file);
      setSourceParsedData(result.data);
      setParsedData(result.data);
      setSelectionError(null);
      setParseProgress(null);
    }
  }, []);

  const handlePageSelectionChange = useCallback((criteria: PageSelectionCriteria) => {
    if (!sourceParsedData) return;

    const filtered = applyPageSelectionToParsedPdf(sourceParsedData, criteria);

    if (!filtered.success) {
      setSelectionError(filtered.error.message);
      return;
    }

    setSelectionError(null);
    setParsedData(filtered.data);
  }, [sourceParsedData]);

  const handleSectionSelect = useCallback((section: { id: string; title: string; content: string }) => {
    // Store the text in session storage for the practice page
    sessionStorage.setItem('practice_text', section.content);
    sessionStorage.setItem('practice_source', 'pdf');
    sessionStorage.setItem('practice_title', section.title);
    
    router.push('/practice');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-6">
        {/* Back button */}
        <div className="max-w-6xl mx-auto mb-8">
          <Link 
            href="/home"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {parsedData ? (
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {sourceFile && sourceParsedData && (
              <PdfPageSelector
                key={`${sourceFile.name}-${sourceFile.size}-${sourceFile.lastModified}`}
                file={sourceFile}
                totalPages={sourceParsedData.pageCount}
                onSelectionChange={handlePageSelectionChange}
              />
            )}

            {selectionError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {selectionError}
              </div>
            )}

            <SectionSelector
              sections={parsedData.sections}
              pdfName={parsedData.name}
              onSelect={handleSectionSelect}
              isLoading={false}
              pagesLabel={`${parsedData.selectedPageCount} of ${parsedData.pageCount} pages included`}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-100 mb-3">
                Upload a PDF
              </h1>
              <p className="text-zinc-400 max-w-md mx-auto">
                Select a PDF document to extract text and practice typing
              </p>
            </div>

            {parseProgress && (
              <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300">
                Processing page {parseProgress.current} of {parseProgress.total} (source page {parseProgress.pageNumber})
              </div>
            )}

            <PdfUploader onUpload={handleUpload} onProgressChange={setParseProgress} />
          </div>
        )}
      </main>
    </div>
  );
}
