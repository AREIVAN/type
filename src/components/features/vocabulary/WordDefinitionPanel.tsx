'use client';

import { useState, useCallback, useEffect } from 'react';
import { BookOpen, X, History, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { lookupWord } from '@/services/vocabulary-service';
import { WordDefinition } from '@/types';
import { saveRecentWord, getRecentWords, StoredWord } from '@/utils/storage';

interface WordDefinitionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWord: string | null;
}

export function WordDefinitionPanel({ isOpen, onClose, selectedWord }: WordDefinitionPanelProps) {
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentWords, setRecentWords] = useState<StoredWord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load recent words on mount
  useEffect(() => {
    setRecentWords(getRecentWords());
  }, []);

  const handleWordClick = useCallback(async (word: string) => {
    if (!word.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    // Clean the word
    const cleanWord = word.toLowerCase().replace(/[^a-zA-Z]/g, '');
    
    try {
      const result = lookupWord(cleanWord);
      
      if (result) {
        setDefinition(result);
        
        // Save to recent words
        const recentWord: StoredWord = {
          word: cleanWord,
          translation: result.translation,
          viewedAt: new Date().toISOString(),
        };
        saveRecentWord(recentWord);
        setRecentWords(getRecentWords());
      } else {
        setDefinition(null);
        setError(`No definition found for "${cleanWord}"`);
      }
    } catch (err) {
      setError('Failed to look up word');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle selected word from typing area
  useEffect(() => {
    if (selectedWord) {
      handleWordClick(selectedWord);
    }
  }, [selectedWord, handleWordClick]);

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-zinc-100">Vocabulary</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded transition-colors"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">{error}</p>
            <p className="text-zinc-600 text-xs mt-2">
              Try clicking on common English words
            </p>
          </div>
        ) : definition ? (
          <div className="space-y-4">
            {/* Word */}
            <div>
              <h3 className="text-2xl font-semibold text-zinc-100 capitalize">
                {definition.word}
              </h3>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                {definition.partOfSpeech}
              </span>
            </div>

            {/* Translation */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">{definition.translation}</p>
            </div>

            {/* Definition */}
            <div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {definition.definition}
              </p>
            </div>

            {/* Example */}
            {definition.example && (
              <div className="p-3 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Example</p>
                <p className="text-sm text-zinc-300 italic">{definition.example}</p>
              </div>
            )}

            {/* Tip */}
            <p className="text-xs text-zinc-600 pt-2">
              Click on any word in the text to look up its meaning
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recent Words */}
            {recentWords.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">
                    Recently Viewed
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentWords.slice(0, 10).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleWordClick(item.word)}
                      className="px-2 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 rounded transition-colors text-zinc-300"
                    >
                      {item.word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {recentWords.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">
                  Click on any word in the text to see its definition
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}