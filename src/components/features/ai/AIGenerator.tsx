'use client';

import { useState, useCallback, useRef } from 'react';
import { Sparkles, Loader2, ChevronRight, Check, RotateCcw, Wand2, ArrowLeft, ArrowRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { CEFRLevel, Length, GeneratedContent, SpanishHints, BlanksMode, PracticeObjective, PracticeTopic } from '@/types';
import { cefrConfigs } from '@/config/ai-generation/cefrConfig';
import { lengthConfigs } from '@/config/ai-generation/lengthConfig';
import { getObjectiveLabel, getTopicLabel, objectiveOptions, topicOptions } from '@/config/ai-generation/personalizationConfig';
import { spanishHintOptions, blanksModeOptions, defaultLearningSupport } from '@/config/ai-generation';
import { getWeakWords } from '@/utils/storage';

interface AIGeneratorProps {
  onGenerate: (params: {
    cefrLevel: CEFRLevel;
    topic: PracticeTopic;
    objective: PracticeObjective;
    length: Length;
    useWeakWords: boolean;
    weakWords: string[];
    learningSupport?: { spanishHints: SpanishHints; blanksMode: BlanksMode };
  }) => Promise<void>;
  onSelect: (content: GeneratedContent) => void;
  generatedContent: GeneratedContent | null;
  isGenerating: boolean;
  error?: string | null;
}

export function AIGenerator({ 
  onGenerate, 
  onSelect, 
  generatedContent, 
  isGenerating, 
  error
}: AIGeneratorProps) {
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1');
  const [topic, setTopic] = useState<PracticeTopic>('daily-conversation');
  const [objective, setObjective] = useState<PracticeObjective>('reading-fluency');
  const [length, setLength] = useState<Length>('medium');
  const [useWeakWords, setUseWeakWords] = useState(false);
  const [weakWords] = useState<string[]>(() => getWeakWords());
  const [spanishHints, setSpanishHints] = useState<SpanishHints>(defaultLearningSupport.spanishHints);
  const [blanksMode, setBlanksMode] = useState<BlanksMode>(defaultLearningSupport.blanksMode);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = async () => {
    await onGenerate({ 
      cefrLevel, 
      topic,
      objective,
      length,
      useWeakWords,
      weakWords: useWeakWords ? weakWords : [],
      learningSupport: { spanishHints, blanksMode }
    });
  };

  const handleStartPractice = () => {
    if (!generatedContent) {
      return;
    }

    onSelect({
      ...generatedContent,
      title: titleInputRef.current?.value.trim() || generatedContent.title,
      text: textAreaRef.current?.value.trim() || generatedContent.text,
    });
  };

  const handleDifficulty = useCallback((direction: 'easier' | 'harder') => {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
    const currentIndex = levels.indexOf(cefrLevel);
    
    if (direction === 'easier' && currentIndex > 0) {
      setCefrLevel(levels[currentIndex - 1]);
    } else if (direction === 'harder' && currentIndex < levels.length - 1) {
      setCefrLevel(levels[currentIndex + 1]);
    }
  }, [cefrLevel]);

  const showEmptyState = !generatedContent && !isGenerating && !error;
  const cefrConfig = cefrConfigs[cefrLevel];

  // Options for dropdowns
  const cefrOptions = Object.entries(cefrConfigs).map(([key, config]) => ({
    value: key,
    label: config.label
  }));

  const lengthOptions = Object.entries(lengthConfigs).map(([key, config]) => ({
    value: key,
    label: `${config.label} (${config.wordCountRange})`
  }));

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">AI Practice Text</h2>
          <p className="text-xs text-zinc-500">Customized English practice content</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          type="error"
          title="Generation failed"
          message={error}
          action={{
            label: 'Try Again',
            onClick: handleGenerate,
          }}
          className="mb-4"
        />
      )}

      {/* Main Configuration */}
      {showEmptyState && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* CEFR Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">CEFR Level</label>
            <select
              value={cefrLevel}
              onChange={(e) => setCefrLevel(e.target.value as CEFRLevel)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              {cefrOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as PracticeTopic)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            >
              {topicOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Practice Objective */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Objective</label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as PracticeObjective)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              {objectiveOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Session Length */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Length</label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as Length)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            >
              {lengthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showEmptyState && (
        <div className="mb-4 p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span className="block text-sm font-medium text-zinc-200">Use my weak words</span>
              <span className="block text-xs text-zinc-500">
                {weakWords.length > 0
                  ? `${weakWords.slice(0, 5).join(', ')}${weakWords.length > 5 ? '...' : ''}`
                  : 'No weak words found yet. Generation will continue normally.'}
              </span>
            </span>
            <input
              type="checkbox"
              checked={useWeakWords}
              onChange={(event) => setUseWeakWords(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-blue-500"
            />
          </label>
        </div>
      )}

      {/* Learning Support - Compact row */}
      {showEmptyState && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Wand2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Support:</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={spanishHints}
              onChange={(e) => setSpanishHints(e.target.value as SpanishHints)}
              className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              {spanishHintOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={blanksMode}
              onChange={(e) => setBlanksMode(e.target.value as BlanksMode)}
              className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            >
              {blanksModeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        size="lg"
        className="w-full mb-4"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Practice Text
          </>
        )}
      </Button>

      {/* Generated Content Preview */}
      {generatedContent && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-zinc-400">Generated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {generatedContent.cefrLevel}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {generatedContent.topic ? getTopicLabel(generatedContent.topic) : 'Topic'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {generatedContent.length}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {generatedContent.generationSource === 'fallback' && (
              <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                AI generation was unavailable, so we used a fallback practice text.
              </div>
            )}
            <label className="mb-2 block text-[10px] text-zinc-600 uppercase tracking-wider">Title</label>
            <input
              ref={titleInputRef}
              key={`title-${generatedContent.id}`}
              defaultValue={generatedContent.title ?? ''}
              className="mb-3 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <label className="mb-2 flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-wider">
              <Pencil className="h-3 w-3" />
              Preview and edit
            </label>
            <textarea
              ref={textAreaRef}
              key={`text-${generatedContent.id}`}
              defaultValue={generatedContent.text}
              rows={8}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 font-mono text-sm leading-relaxed text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />

            {/* Key Vocabulary */}
            {generatedContent.keywordsUsed && generatedContent.keywordsUsed.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-800/50">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Keywords Used</p>
                <div className="flex flex-wrap gap-1.5">
                  {generatedContent.keywordsUsed.slice(0, 8).map((word, idx) => (
                    <span 
                      key={idx}
                      className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-[11px] text-zinc-500"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty */}
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-zinc-500">
              <span>Objective: {generatedContent.objective ? getObjectiveLabel(generatedContent.objective) : 'Practice'}</span>
              {generatedContent.estimatedDifficulty && <span>Difficulty: {generatedContent.estimatedDifficulty}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-2">
            <Button
              onClick={handleStartPractice}
              className="flex-1"
              size="sm"
            >
              Start Practice
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              title="Regenerate"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDifficulty('easier')}
              title="Easier"
              disabled={cefrLevel === 'A1'}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDifficulty('harder')}
              title="Harder"
              disabled={cefrLevel === 'C1'}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State Hint */}
      {showEmptyState && (
        <p className="text-center text-xs text-zinc-500 mb-4">
          {cefrConfig?.description}
        </p>
      )}

      {/* Info */}
      <div className="p-2.5 bg-zinc-900/30 border border-zinc-800/40 rounded-lg">
        <p className="text-[10px] text-zinc-600 text-center">
          Texts are generated securely on the server via Groq.
        </p>
      </div>
    </div>
  );
}
