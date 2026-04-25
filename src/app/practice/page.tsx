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
import { SessionMetadata } from '@/types';

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

export default function PracticePage() {
  const router = useRouter();
  const addToHistory = useHistoryStore(s => s.add);
  const typingAreaRef = useRef<HTMLDivElement>(null);
  
  const [text] = useState(() => (typeof window === 'undefined' ? '' : sessionStorage.getItem('practice_text') ?? ''));
  const [source] = useState<'pdf' | 'ai' | 'manual'>(() => {
    if (typeof window === 'undefined') {
      return 'manual';
    }

    return (sessionStorage.getItem('practice_source') as 'pdf' | 'ai' | 'manual' | null) ?? 'manual';
  });
  const [title] = useState(() => (typeof window === 'undefined' ? '' : sessionStorage.getItem('practice_title') ?? ''));
  const [metadata] = useState<SessionMetadata | undefined>(() => getStoredPracticeMetadata());
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load text from session storage on mount
  useEffect(() => {
    if (!text) {
      router.push('/home');
    }
  }, [router, text]);

  const handleComplete = useCallback((metrics: TypingEngineState['metrics']) => {
    setIsCompleted(true);
    
    // Save to history
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
  }, [addToHistory, source, title, text, metadata]);

  const handleProgress = useCallback((metrics: TypingEngineState['metrics'], progress: number) => {
    // Can be used for real-time updates
  }, []);

  const { state, handleInput, restart } = useTypingEngine({
    text,
    onComplete: handleComplete,
    onProgress: handleProgress,
  });

  const handleWordClick = useCallback((word: string) => {
    setSelectedWord(word);
    setShowVocabulary(true);
  }, []);

  const handleRestart = useCallback(() => {
    restart();
    setIsCompleted(false);
  }, [restart]);

  const handleNewText = useCallback(() => {
    sessionStorage.removeItem('practice_text');
    sessionStorage.removeItem('practice_source');
    sessionStorage.removeItem('practice_title');
    sessionStorage.removeItem('practice_metadata');
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
    enabled: !isCompleted,
  });

  if (!text) return null;

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
                    {title || 'Practice Session'}
                  </h1>
                  <p className="text-xs text-zinc-500 capitalize">
                    {source} • {text.length} characters
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
              progress={state.currentIndex / Math.max(state.metrics.totalChars, 1)}
              status={state.status}
            />
          </div>

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
            />
          </div>
          
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
                    <p className="text-2xl font-bold text-blue-400">{state.metrics.wpm}</p>
                    <p className="text-xs text-zinc-500">WPM</p>
                  </div>
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-400">{state.metrics.accuracy}%</p>
                    <p className="text-xs text-zinc-500">Accuracy</p>
                  </div>
                  <div className="p-3 bg-zinc-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-red-400">{state.metrics.errors}</p>
                    <p className="text-xs text-zinc-500">Errors</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
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
