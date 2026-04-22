'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PenLine } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';

export default function ManualPage() {
  const router = useRouter();
  const [text, setText] = useState('');

  const handleStart = useCallback(() => {
    if (!text.trim()) return;
    
    sessionStorage.setItem('practice_text', text);
    sessionStorage.setItem('practice_source', 'manual');
    sessionStorage.setItem('practice_title', 'Custom Text');
    
    router.push('/practice');
  }, [text, router]);

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

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <PenLine className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-3">
              Manual Text Input
            </h1>
            <p className="text-zinc-400 max-w-md mx-auto">
              Type or paste your own text to practice typing
            </p>
          </div>

          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter or paste your practice text here..."
              className="w-full h-64 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-mono text-sm leading-relaxed"
            />

            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                {text.length} characters
              </p>
              
              <Button
                onClick={handleStart}
                disabled={text.trim().length < 10}
                size="lg"
              >
                Start Practice
              </Button>
            </div>

            {text.trim().length < 10 && text.length > 0 && (
              <p className="text-xs text-zinc-500 text-center">
                Enter at least 10 characters to start practicing
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}