'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Languages, RotateCcw, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricsBar } from '@/components/features/typing/MetricsBar';
import { VerbPracticeArea } from '@/components/features/verbs/VerbPracticeArea';
import { VerbPracticeControls } from '@/components/features/verbs/VerbPracticeControls';
import { fallbackVerbBank } from '@/config/verb-practice/fallbackBank';
import {
  clampVerbCount,
  fillWithFallbackItems,
  isCorrectVerbAnswer,
  isVerbAnswerComplete,
} from '@/features/verb-practice/helpers';
import { generateVerbPracticeItems } from '@/services/ai-service';
import { useHistoryStore } from '@/store/useHistoryStore';
import { getFailedVerbs, saveFailedVerbs } from '@/utils/storage';
import { VerbPracticeAnswerResult, VerbPracticeItem, VerbPracticeTrack } from '@/types';

export default function VerbsPage() {
  const addToHistory = useHistoryStore(s => s.add);
  const [count, setCount] = useState(10);
  const [track, setTrack] = useState<VerbPracticeTrack>('A1');
  const [items, setItems] = useState<VerbPracticeItem[]>([]);
  const [results, setResults] = useState<Record<string, VerbPracticeAnswerResult>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [message, setMessage] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState<'ai' | 'fallback'>('fallback');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!startedAt || isCompleted) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsed((Date.now() - startedAt) / 1000);
    }, 250);

    return () => window.clearInterval(interval);
  }, [startedAt, isCompleted]);

  const completedResults = useMemo(() => Object.values(results), [results]);
  const orderedResults = useMemo(
    () => items.map(item => results[item.id]).filter((result): result is VerbPracticeAnswerResult => Boolean(result)),
    [items, results]
  );
  const currentIndex = orderedResults.length;
  const correctCount = completedResults.filter(result => result.correct).length;
  const incorrectCount = completedResults.filter(result => !result.correct).length;
  const progress = items.length === 0 ? 0 : completedResults.length / items.length;
  const accuracy = completedResults.length === 0 ? 100 : Math.round((correctCount / completedResults.length) * 100);
  const typedCharacters = orderedResults.reduce((total, result) => total + result.answer.length, 0) + currentInput.length;
  const wpm = elapsed > 0 ? Math.round(typedCharacters / 5 / (elapsed / 60)) : 0;

  useEffect(() => {
    if (items.length > 0 && !isCompleted) {
      hiddenInputRef.current?.focus();
    }
  }, [items, isCompleted]);

  const handleCountChange = useCallback((value: number) => {
    const nextCount = clampVerbCount(value);
    setCount(nextCount);
    setMessage(value !== nextCount ? `Quantity was limited to ${nextCount}.` : undefined);
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setMessage(undefined);
    setResults({});
    setCurrentInput('');
    setIsCompleted(false);
    setStartedAt(null);
    setElapsed(0);

    const failedForTrack = getFailedVerbs().filter(item => item.track === track);

    try {
      const response = await generateVerbPracticeItems({ count, track });
      const nextItems = fillWithFallbackItems(response.items, track, count, failedForTrack);
      setItems(nextItems);
      setGenerationSource(response.source);
      setStartedAt(Date.now());
      setMessage(
        nextItems.length < count
          ? `Only ${nextItems.length} unique verbs are available for this track right now.`
          : failedForTrack.length > 0
            ? 'Some previously missed verbs were included for another try.'
            : undefined
      );
    } catch (error) {
      const nextItems = fillWithFallbackItems(fallbackVerbBank[track], track, count, failedForTrack);
      setItems(nextItems);
      setGenerationSource('fallback');
      setStartedAt(Date.now());
      setMessage(error instanceof Error ? `${error.message} Using static fallback verbs.` : 'Using static fallback verbs.');
    } finally {
      setIsGenerating(false);
    }
  }, [count, track]);

  const handleInputChange = useCallback((value: string) => {
    setCurrentInput(value.replace(/[\s.·]+/g, ''));
  }, []);

  const handleSubmitCurrent = useCallback(() => {
    const item = items[currentIndex];
    if (!item || !isVerbAnswerComplete(currentInput, item.text)) {
      return;
    }

    setResults(previous => ({
      ...previous,
      [item.id]: {
        itemId: item.id,
        text: item.text,
        translationEs: item.translationEs,
        expected: item.text,
        answer: currentInput,
        correct: isCorrectVerbAnswer(currentInput, item.text),
      },
    }));
    setCurrentInput('');
  }, [currentIndex, currentInput, items]);

  const handleBackspaceFromEmptyInput = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  const handleComplete = useCallback(() => {
    const resultList = items.map(item => results[item.id]).filter((result): result is VerbPracticeAnswerResult => Boolean(result));
    const failed = resultList.filter(result => !result.correct);
    const failedItems = items.filter(item => failed.some(result => result.itemId === item.id));
    const retainedFailed = getFailedVerbs().filter(item => !items.some(current => current.id === item.id));
    saveFailedVerbs([...failedItems, ...retainedFailed]);

    const finalCorrect = resultList.filter(result => result.correct).length;
    const finalIncorrect = resultList.length - finalCorrect;
    const finalAccuracy = resultList.length === 0 ? 100 : Math.round((finalCorrect / resultList.length) * 100);
    const finalTime = Math.max(1, Math.round(elapsed));
    const finalWpm = Math.round(resultList.reduce((total, result) => total + result.answer.length, 0) / 5 / (finalTime / 60));

    addToHistory({
      id: `verbs_${Date.now()}`,
      source: 'verbs',
      title: `Verb Trainer - ${track}`,
      text: items.map(item => `${item.text} (${item.translationEs})`).join(', '),
      wpm: finalWpm,
      accuracy: finalAccuracy,
      errors: finalIncorrect,
      time: finalTime,
      metadata: {
        type: 'verbs',
        track,
        requestedCount: count,
        finalCount: items.length,
        generationSource,
        items,
        answers: resultList,
        correctCount: finalCorrect,
        incorrectCount: finalIncorrect,
      },
    });

    setIsCompleted(true);
    setMessage(failed.length > 0 ? `${failed.length} missed verb(s) will appear again later.` : 'Perfect. No failed verbs saved.');
  }, [addToHistory, count, elapsed, generationSource, items, results, track]);

  const canComplete = items.length > 0 && completedResults.length === items.length;
  const trackSummary = track === 'technical-engineering' ? 'Technical Engineering' : `${track} ${track === 'A1' ? 'Beginner' : track === 'A2' ? 'Elementary' : track === 'B1' ? 'Intermediate' : track === 'B2' ? 'Upper Intermediate' : 'Advanced'}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-6">
        <div className="max-w-6xl mx-auto mb-8">
          <Link href="/home" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <section className="max-w-5xl mx-auto space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <Languages className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Verb transcription practice
            </div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-3">Verb Trainer</h1>
            <p className="text-sm font-medium text-cyan-300 mb-3">{trackSummary} · {items.length || count} verbs</p>
            <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Type the verbs in order. Spanish meanings stay secondary below the sequence.
            </p>
          </div>

          <VerbPracticeControls
            count={count}
            track={track}
            isGenerating={isGenerating}
            message={message}
            onCountChange={handleCountChange}
            onTrackChange={setTrack}
            onGenerate={handleGenerate}
          />

          {items.length > 0 ? (
            <>
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <MetricsBar
                  wpm={wpm}
                  accuracy={accuracy}
                  errors={incorrectCount}
                  time={elapsed}
                  progress={progress}
                  status={isCompleted ? 'completed' : 'active'}
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-400">Correct: {correctCount}</span>
                  <span className="text-red-400">Incorrect: {incorrectCount}</span>
                  <span className="text-zinc-500 capitalize">Source: {generationSource}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleGenerate} disabled={isGenerating}>
                    <RotateCcw className="w-4 h-4" />
                    New Session
                  </Button>
                  <Button onClick={handleComplete} disabled={!canComplete || isCompleted}>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Results
                  </Button>
                </div>
              </div>

              <VerbPracticeArea
                items={items}
                currentIndex={currentIndex}
                inputValue={currentInput}
                results={results}
                inputRef={hiddenInputRef}
                onInputChange={handleInputChange}
                onBackspace={handleBackspaceFromEmptyInput}
                onSubmitCurrent={handleSubmitCurrent}
              />
            </>
          ) : (
            <EmptyState
              icon="default"
              title="No verb session yet"
              description="Choose a quantity and level, then generate a focused verb transcription session."
              action={{ label: 'Generate A1 Session', onClick: handleGenerate }}
            />
          )}
        </section>
      </main>
    </div>
  );
}
