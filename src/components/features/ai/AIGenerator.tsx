'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Loader2, ChevronRight, Check, RotateCcw, Wand2, ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { CEFRLevel, PracticeGoal, Length, GeneratedContent, SpanishHints, BlanksMode } from '@/types';
import { cefrConfigs } from '@/config/ai-generation/cefrConfig';
import { practiceGoalConfigs } from '@/config/ai-generation/practiceGoalConfig';
import { lengthConfigs } from '@/config/ai-generation/lengthConfig';
import { spanishHintOptions, blanksModeOptions, defaultLearningSupport } from '@/config/ai-generation';

interface AIGeneratorProps {
  onGenerate: (params: { cefrLevel: CEFRLevel; practiceGoal: PracticeGoal; length: Length; learningSupport?: { spanishHints: SpanishHints; blanksMode: BlanksMode } }) => Promise<void>;
  onSelect: (content: GeneratedContent) => void;
  generatedContent: GeneratedContent | null;
  isGenerating: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
}

export function AIGenerator({ 
  onGenerate, 
  onSelect, 
  generatedContent, 
  isGenerating, 
  error, 
  onErrorDismiss 
}: AIGeneratorProps) {
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1');
  const [practiceGoal, setPracticeGoal] = useState<PracticeGoal>('daily-conversations');
  const [length, setLength] = useState<Length>('medium');
  const [spanishHints, setSpanishHints] = useState<SpanishHints>(defaultLearningSupport.spanishHints);
  const [blanksMode, setBlanksMode] = useState<BlanksMode>(defaultLearningSupport.blanksMode);

  const handleGenerate = async () => {
    await onGenerate({ 
      cefrLevel, 
      practiceGoal, 
      length,
      learningSupport: { spanishHints, blanksMode }
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
  const goalConfig = practiceGoalConfigs[practiceGoal];

  // Options for dropdowns
  const cefrOptions = Object.entries(cefrConfigs).map(([key, config]) => ({
    value: key,
    label: config.label
  }));

  const practiceGoalOptions = Object.entries(practiceGoalConfigs).map(([key, config]) => ({
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
            onClick: () => onErrorDismiss?.(),
          }}
          className="mb-4"
        />
      )}

      {/* Main Configuration Row - 3 columns */}
      {showEmptyState && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
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

          {/* Practice Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Practice Goal</label>
            <select
              value={practiceGoal}
              onChange={(e) => setPracticeGoal(e.target.value as PracticeGoal)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            >
              {practiceGoalOptions.map((opt) => (
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
                {practiceGoalConfigs[generatedContent.practiceGoal as PracticeGoal]?.label.split(' ')[0] || 'Goal'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {generatedContent.length}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {generatedContent.title && (
              <h3 className="text-base font-medium text-zinc-200 mb-2">
                {generatedContent.title}
              </h3>
            )}
            <p className="text-sm text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap line-clamp-4">
              {generatedContent.text}
            </p>

            {/* Key Vocabulary */}
            {generatedContent.keyVocabulary && generatedContent.keyVocabulary.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-800/50">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Key Vocabulary</p>
                <div className="flex flex-wrap gap-1.5">
                  {generatedContent.keyVocabulary.slice(0, 6).map((word, idx) => (
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
            {generatedContent.estimatedDifficulty && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] text-zinc-600">Difficulty:</span>
                <div className="flex-1 max-w-[60px] h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-red-500"
                    style={{ width: `${(generatedContent.estimatedDifficulty / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500">{generatedContent.estimatedDifficulty}/10</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-2">
            <Button
              onClick={() => onSelect(generatedContent)}
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
          Pre-written templates. Real AI would generate unlimited content.
        </p>
      </div>
    </div>
  );
}