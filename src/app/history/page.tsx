'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Trash2, FileText, Sparkles, PenLine } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHistoryStore } from '@/store/useHistoryStore';

const sourceIcons = {
  pdf: FileText,
  ai: Sparkles,
  manual: PenLine,
};

const sourceColors = {
  pdf: 'text-red-400 bg-red-500/20',
  ai: 'text-purple-400 bg-purple-500/20',
  manual: 'text-emerald-400 bg-emerald-500/20',
};

export default function HistoryPage() {
  const { sessions, load, clear } = useHistoryStore();

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage="history" />
      
      <main className="flex-1 py-12 px-6">
        {/* Back button */}
        <div className="max-w-4xl mx-auto mb-8">
          <Link 
            href="/home"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100 mb-2">
                Practice History
              </h1>
              <p className="text-zinc-400">
                {sessions.length} sessions recorded
              </p>
            </div>
            
            {sessions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                className="text-zinc-400 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>

          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => {
                const SourceIcon = sourceIcons[session.source as keyof typeof sourceIcons] || FileText;
                const colorClass = sourceColors[session.source as keyof typeof sourceColors] || sourceColors.manual;
                
                return (
                  <div
                    key={session.id}
                    className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <SourceIcon className="w-5 h-5" />
                      </div>
                      
                      <div>
                        <p className="font-medium text-zinc-100">
                          {session.title || 'Practice Session'}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(session.completedAt)}
                          </span>
                          <span className="text-xs text-zinc-600">
                            •
                          </span>
                          <span className="text-xs text-zinc-500 capitalize">
                            {session.source}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-mono font-semibold text-blue-400">
                          {session.wpm}
                        </p>
                        <p className="text-xs text-zinc-500">WPM</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-mono font-semibold text-emerald-400">
                          {session.accuracy}%
                        </p>
                        <p className="text-xs text-zinc-500">Accuracy</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-mono font-semibold text-zinc-300">
                          {session.time}s
                        </p>
                        <p className="text-xs text-zinc-500">Time</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="history"
              title="No practice sessions yet"
              description="Complete a typing session to see your history, track your WPM progress, and review your accuracy."
              action={{
                label: 'Start Practicing',
                onClick: () => window.location.href = '/home',
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}