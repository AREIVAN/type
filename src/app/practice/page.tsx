'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, Home, BookOpen, Keyboard, X } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { TypingArea } from '@/components/features/typing/TypingArea';
import { MetricsBar } from '@/components/features/typing/MetricsBar';
import { WordDefinitionPanel } from '@/components/features/vocabulary/WordDefinitionPanel';
import { useTypingEngine, TypingEngineState } from '@/features/typing/hooks/useTypingEngine';
import { useHistoryStore } from '@/store/useHistoryStore';
import { Button } from '@/components/ui/Button';
import { useKeyboardShortcuts, SHORTCUTS_HELP } from '@/hooks/useKeyboardShortcuts';
import { PdfPageMetrics, PdfPracticeSession, PdfSessionMetadata, SessionMetadata } from '@/types';
import { calculateAccuracy, calculateWPM } from '@/utils/metrics';

function getStoredPracticeMetadata(): SessionMetadata | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const storedMetadata = sessionStorage.getItem('practice_metadata');
  if (!storedMetadata) {
    return undefined;
  }

  try {
    return JSON.parse(storedMetadata) as SessionMetadata;
  } catch {
    return undefined;
  }
}

function getStoredPdfPracticeSession(): PdfPracticeSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedSession = sessionStorage.getItem('practice_pdf_session');
  if (!storedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedSession) as PdfPracticeSession;

    if (!Array.isArray(parsed.selectedPages) || parsed.selectedPages.length === 0) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function getAggregatePdfMetrics(pageMetrics: PdfPageMetrics[]) {
  const correctChars = pageMetrics.reduce((total, page) => total + page.correctChars, 0);
  const errors = pageMetrics.reduce((total, page) => total + page.errors, 0);
  const time = pageMetrics.reduce((total, page) => total + page.time, 0);
  const totalChars = pageMetrics.reduce((total, page) => total + page.totalChars, 0);

  return {
    wpm: calculateWPM(correctChars, time),
    accuracy: calculateAccuracy(correctChars, correctChars + errors),
    errors,
    correctChars,
    totalChars,
    time,
  };
}

export default function PracticePage() {
  const router = useRouter();
  const addToHistory = useHistoryStore(s => s.add);
  const typingAreaRef = useRef<HTMLDivElement>(null);
  
  // Initialize with consistent values for SSR (will be overwritten in useEffect after hydration)
  const [text, setText] = useState('');
  const [source, setSource] = useState<'pdf' | 'ai' | 'manual'>('manual');
  const [title, setTitle] = useState('');
  const [metadata, setMetadata] = useState<SessionMetadata | undefined>(undefined);
  const [pdfSession, setPdfSession] = useState<PdfPracticeSession | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(() => pdfSession?.currentPageIndex ?? 0);
  const [pageMetrics, setPageMetrics] = useState<PdfPageMetrics[]>([]);
  const [pageCompletionMetrics, setPageCompletionMetrics] = useState<TypingEngineState['metrics'] | null>(null);
  const [hasSavedPdfResult, setHasSavedPdfResult] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [selectedWord] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const isPdfPractice = source === 'pdf' && pdfSession !== null;
  const currentPdfPage = isPdfPractice ? pdfSession.selectedPages[currentPageIndex] : undefined;
  const activeText = currentPdfPage?.text ?? text;
  const allowCorrections = (['pdf', 'ai', 'manual'] as const).includes(source as 'pdf');

  const savePdfSession = useCallback((nextSession: PdfPracticeSession) => {
    setPdfSession(nextSession);
    sessionStorage.setItem('practice_pdf_session', JSON.stringify(nextSession));
    sessionStorage.setItem('practice_text', nextSession.selectedPages[nextSession.currentPageIndex]?.text ?? '');
  }, []);

  // Hydrate from sessionStorage after mount
  useEffect(() => {
    setText(sessionStorage.getItem('practice_text') ?? '');
    setSource((sessionStorage.getItem('practice_source') as 'pdf' | 'ai' | 'manual') ?? 'manual');
    setTitle(sessionStorage.getItem('practice_title') ?? '');
    setMetadata(getStoredPracticeMetadata());
    setPdfSession(getStoredPdfPracticeSession());
    setIsHydrated(true);
  }, []);

  // Load text from session storage on mount
  useEffect(() => {
    // Only redirect after hydration is complete to avoid premature redirect
    if (isHydrated && !activeText) {
      router.push('/home');
    }
  }, [router, activeText, isHydrated]);

  const handleComplete = useCallback((metrics: TypingEngineState['metrics']) => {
    if (isPdfPractice && pdfSession && currentPdfPage) {
      const pageMetric: PdfPageMetrics = {
        pageNumber: currentPdfPage.pageNumber,
        selectedPageIndex: currentPageIndex,
        wpm: metrics.wpm,
        accuracy: metrics.accuracy,
        errors: metrics.errors,
        time: metrics.time,
        correctChars: metrics.correctChars,
        totalChars: metrics.totalChars,
      };
      const nextPageMetrics = [...pageMetrics.filter((page) => page.pageNumber !== currentPdfPage.pageNumber), pageMetric]
        .sort((a, b) => a.selectedPageIndex - b.selectedPageIndex);
      const nextCompletedPages = [...new Set([...pdfSession.completedPages, currentPdfPage.pageNumber])];
      const nextSession = {
        ...pdfSession,
        completedPages: nextCompletedPages,
      };

      setPageMetrics(nextPageMetrics);
      savePdfSession(nextSession);

      if (currentPageIndex >= pdfSession.selectedPages.length - 1) {
        setIsCompleted(true);
      } else {
        setPageCompletionMetrics(metrics);
      }

      return;
    }

    setIsCompleted(true);

    addToHistory({
      id: `session_${Date.now()}`,
      source,
      title,
      text: text.slice(0, 100) + '...',
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
      errors: metrics.errors,
      time: Math.round(metrics.time),
      metadata,
    });
  }, [addToHistory, currentPageIndex, currentPdfPage, isPdfPractice, metadata, pageMetrics, pdfSession, savePdfSession, source, text, title]);

  const handleProgress = useCallback(() => {
    // Can be used for real-time updates
  }, []);

  const { state, handleInput, handleDelete, restart } = useTypingEngine({
    text: activeText,
    allowCorrections,
    onComplete: handleComplete,
    onProgress: handleProgress,
  });

  const totalPdfChars = pdfSession?.selectedPages.reduce((total, page) => total + page.characterCount, 0) ?? activeText.length;
  const completedPdfChars = pageMetrics.reduce((total, page) => total + page.totalChars, 0);
  const activePageAlreadyCompleted = pageMetrics.some((page) => page.pageNumber === currentPdfPage?.pageNumber);
  const overallPdfProgress = isPdfPractice
    ? (completedPdfChars + (activePageAlreadyCompleted ? 0 : state.currentIndex)) / Math.max(totalPdfChars, 1)
    : 0;
  const currentPageProgress = state.currentIndex / Math.max(state.metrics.totalChars, 1);
  const selectedPagePosition = currentPageIndex + 1;
  const selectedPageTotal = pdfSession?.selectedPages.length ?? 0;
  const pdfAggregateMetrics = getAggregatePdfMetrics(pageMetrics);

  const handleRestart = useCallback(() => {
    if (isPdfPractice && pdfSession && isCompleted) {
      const nextSession = {
        ...pdfSession,
        currentPageIndex: 0,
        completedPages: [],
      };

      setCurrentPageIndex(0);
      setPageMetrics([]);
      setPageCompletionMetrics(null);
      setHasSavedPdfResult(false);
      savePdfSession(nextSession);
    } else {
      setPageCompletionMetrics(null);
    }

    restart();
    setIsCompleted(false);
  }, [isCompleted, isPdfPractice, pdfSession, restart, savePdfSession]);

  const handleContinuePdfPage = useCallback(() => {
    if (!pdfSession) return;

    const nextPageIndex = currentPageIndex + 1;
    const nextSession = {
      ...pdfSession,
      currentPageIndex: nextPageIndex,
    };

    setCurrentPageIndex(nextPageIndex);
    setPageCompletionMetrics(null);
    savePdfSession(nextSession);
  }, [currentPageIndex, pdfSession, savePdfSession]);

  const handleSavePdfResult = useCallback(() => {
    if (!pdfSession || hasSavedPdfResult) return;

    const aggregateMetrics = getAggregatePdfMetrics(pageMetrics);
    const pdfMetadata: PdfSessionMetadata = {
      type: 'pdf',
      pdfName: pdfSession.pdfName,
      selectedPageNumbers: pdfSession.selectedPages.map((page) => page.pageNumber),
      pagesCompleted: pageMetrics.map((page) => page.pageNumber),
      totalSelectedPages: pdfSession.selectedPages.length,
      perPageMetrics: pageMetrics,
    };

    addToHistory({
      id: `session_${Date.now()}`,
      source: 'pdf',
      title: 'PDF Practice',
      text: `${pdfSession.pdfName} pages ${pdfMetadata.selectedPageNumbers.join(', ')}`,
      wpm: aggregateMetrics.wpm,
      accuracy: aggregateMetrics.accuracy,
      errors: aggregateMetrics.errors,
      time: Math.round(aggregateMetrics.time),
      metadata: pdfMetadata,
    });
    setHasSavedPdfResult(true);
  }, [addToHistory, hasSavedPdfResult, pageMetrics, pdfSession]);

  const handleNewText = useCallback(() => {
    sessionStorage.removeItem('practice_text');
    sessionStorage.removeItem('practice_source');
    sessionStorage.removeItem('practice_title');
    sessionStorage.removeItem('practice_metadata');
    sessionStorage.removeItem('practice_pdf_session');
    router.push('/home');
  }, [router]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'r',
        description: 'Restart test',
        handler: () => {
          if (state.status !== 'idle') {
            handleRestart();
          }
        },
        enabled: () => state.status !== 'idle',
      },
      {
        key: 'h',
        description: 'Go to home',
        handler: handleNewText,
      },
      {
        key: 'v',
        description: 'Toggle vocabulary panel',
        handler: () => setShowVocabulary(prev => !prev),
      },
      {
        key: '/',
        description: 'Focus typing area',
        handler: () => {
          typingAreaRef.current?.focus();
        },
      },
      {
        key: 'Escape',
        description: 'Close modal / cancel',
        handler: () => {
          if (showShortcuts) setShowShortcuts(false);
        },
      },
    ],
    enabled: !isCompleted && pageCompletionMetrics === null,
  });

  if (!activeText) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex">
        {/* Main Practice Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-800">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/home"
                  className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-400" />
                </Link>
                <div>
                  <h1 className="font-medium text-zinc-100">
                    {isPdfPractice ? 'PDF Practice' : title || 'Practice Session'}
                  </h1>
                  <p className="text-xs text-zinc-500 capitalize">
                    {isPdfPractice && currentPdfPage
                      ? `Page ${selectedPagePosition} of ${selectedPageTotal} selected pages • PDF page: ${currentPdfPage.pageNumber}`
                      : `${source} • ${activeText.length} characters`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVocabulary(!showVocabulary)}
                  className={showVocabulary ? 'bg-zinc-800' : ''}
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="border-b border-zinc-800">
            <MetricsBar
              wpm={state.metrics.wpm}
              accuracy={state.metrics.accuracy}
              errors={state.metrics.errors}
              time={state.metrics.time}
              progress={currentPageProgress}
              status={state.status}
            />
          </div>

          {isPdfPractice && currentPdfPage && (
            <div className="border-b border-zinc-800 px-6 py-3">
              <div className="mx-auto flex max-w-4xl flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  PDF page {currentPdfPage.pageNumber} · Selected page {selectedPagePosition}/{selectedPageTotal} · Completed {pageMetrics.length} · Remaining {Math.max(selectedPageTotal - pageMetrics.length, 0)}
                </p>
                <div className="flex items-center gap-2">
                  <span>Overall PDF progress: {Math.round(overallPdfProgress * 100)}%</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(overallPdfProgress * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typing Area */}
          <div 
            className="flex-1 p-6 overflow-auto"
            ref={typingAreaRef}
            tabIndex={-1}
          >
            <TypingArea
              characters={state.characters}
              status={state.status}
              onInput={handleInput}
              onDelete={handleDelete}
              allowCorrections={allowCorrections}
            />
          </div>

          {pageCompletionMetrics && currentPdfPage && pdfSession && (
            <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4 text-center animate-in zoom-in-95 duration-200">
                <p className="text-sm font-medium text-blue-300 mb-2">Page completed</p>
                <h2 className="text-xl font-bold text-zinc-100 mb-1">PDF page {currentPdfPage.pageNumber}</h2>
                <p className="text-xs text-zinc-500 mb-5">Selected page {selectedPagePosition} of {selectedPageTotal}</p>

                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-lg font-bold text-blue-400">{pageCompletionMetrics.wpm}</p>
                    <p className="text-[11px] text-zinc-500">WPM</p>
                  </div>
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-lg font-bold text-emerald-400">{pageCompletionMetrics.accuracy}%</p>
                    <p className="text-[11px] text-zinc-500">Accuracy</p>
                  </div>
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-lg font-bold text-red-400">{pageCompletionMetrics.errors}</p>
                    <p className="text-[11px] text-zinc-500">Errors</p>
                  </div>
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-lg font-bold text-zinc-200">{Math.round(pageCompletionMetrics.time)}s</p>
                    <p className="text-[11px] text-zinc-500">Time</p>
                  </div>
                </div>

                <Button onClick={handleContinuePdfPage} className="w-full" size="lg">
                  Continue to page {pdfSession.selectedPages[currentPageIndex + 1]?.pageNumber}
                </Button>
              </div>
            </div>
          )}
          
          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="fixed bottom-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4 text-zinc-400" />
          </button>
          
          {/* Shortcuts Modal */}
          {showShortcuts && (
            <div 
              className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-20"
              onClick={() => setShowShortcuts(false)}
            >
              <div 
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full mx-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-100">Keyboard Shortcuts</h3>
                  <button
                    onClick={() => setShowShortcuts(false)}
                    className="p-1 hover:bg-zinc-800 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
                <div className="space-y-2">
                  {SHORTCUTS_HELP.map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 font-mono">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Completion Overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center animate-in zoom-in-95 duration-200">
                <h2 className="text-2xl font-bold text-zinc-100 mb-6">
                  Practice Complete!
                </h2>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-400">{isPdfPractice ? pdfAggregateMetrics.wpm : state.metrics.wpm}</p>
                    <p className="text-xs text-zinc-500">WPM</p>
                  </div>
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-400">{isPdfPractice ? pdfAggregateMetrics.accuracy : state.metrics.accuracy}%</p>
                    <p className="text-xs text-zinc-500">Accuracy</p>
                  </div>
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-red-400">{isPdfPractice ? pdfAggregateMetrics.errors : state.metrics.errors}</p>
                    <p className="text-xs text-zinc-500">Errors</p>
                  </div>
                </div>

                {isPdfPractice && pdfSession && (
                  <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-left text-xs text-zinc-400">
                    <p>Total time: {Math.round(pdfAggregateMetrics.time)}s</p>
                    <p>Pages completed: {pageMetrics.length}/{pdfSession.selectedPages.length}</p>
                    <p>Selected pages practiced: {pdfSession.selectedPages.map((page) => page.pageNumber).join(', ')}</p>
                  </div>
                )}
                 
                <div className="flex flex-col gap-3">
                  {isPdfPractice && (
                    <Button onClick={handleSavePdfResult} className="w-full" size="lg" disabled={hasSavedPdfResult}>
                      {hasSavedPdfResult ? 'Results Saved' : 'Save Results'}
                    </Button>
                  )}
                  <Button onClick={handleRestart} className="w-full" size="lg">
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button onClick={handleNewText} variant="secondary" className="w-full" size="lg">
                    <Home className="w-4 h-4" />
                    Choose Another Text
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vocabulary Panel */}
        {showVocabulary && (
          <WordDefinitionPanel
            isOpen={showVocabulary}
            onClose={() => setShowVocabulary(false)}
            selectedWord={selectedWord}
          />
        )}
      </main>
    </div>
  );
}
