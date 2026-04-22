'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PdfUploader } from '@/components/features/pdf/PdfUploader';
import { SectionSelector } from '@/components/features/pdf/SectionSelector';
import { parsePdf, ParseResult, ParsedPdf } from '@/services/pdf-parser';
import Link from 'next/link';

export default function PdfPage() {
  const router = useRouter();
  const [parsedData, setParsedData] = useState<ParsedPdf | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = useCallback(async (result: ParseResult) => {
    if (result.success) {
      setParsedData(result.data);
    }
  }, []);

  const handleSectionSelect = useCallback((section: { id: string; title: string; content: string }) => {
    // Store the text in session storage for the practice page
    sessionStorage.setItem('practice_text', section.content);
    sessionStorage.setItem('practice_source', 'pdf');
    sessionStorage.setItem('practice_title', section.title);
    
    router.push('/practice');
  }, [router]);

  // Reset to upload view
  const handleBack = () => {
    setParsedData(null);
  };

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
          <SectionSelector
            sections={parsedData.sections}
            pdfName={parsedData.name}
            onSelect={handleSectionSelect}
            isLoading={isLoading}
          />
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

            <PdfUploader onUpload={handleUpload} />
          </div>
        )}
      </main>
    </div>
  );
}