'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { AIGenerator } from '@/components/features/ai/AIGenerator';
import { generatePracticeText } from '@/services/ai-service/mocks';
import { CEFRLevel, PracticeGoal, Length, GeneratedContent, SpanishHints, BlanksMode } from '@/types';

export default function AIPage() {
  const router = useRouter();
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<{
    cefrLevel: CEFRLevel;
    practiceGoal: PracticeGoal;
    length: Length;
    learningSupport?: { spanishHints: SpanishHints; blanksMode: BlanksMode };
  } | null>(null);

  // Load any saved content on mount
  useEffect(() => {
    const savedText = sessionStorage.getItem('practice_text');
    const savedSource = sessionStorage.getItem('practice_source');
    
    // If there's a previous AI session, could restore it
    // For now, we start fresh
  }, []);

  const handleGenerate = useCallback(async (params: { 
    cefrLevel: CEFRLevel; 
    practiceGoal: PracticeGoal; 
    length: Length;
    learningSupport?: { spanishHints: SpanishHints; blanksMode: BlanksMode };
  }) => {
    setIsGenerating(true);
    setError(null);
    setCurrentParams(params);
    
    try {
      const content = await generatePracticeText({
        cefrLevel: params.cefrLevel,
        practiceGoal: params.practiceGoal,
        length: params.length,
      });
      setGeneratedContent(content);
    } catch (err) {
      setError('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleSelect = useCallback((content: GeneratedContent) => {
    // Store practice text and metadata
    sessionStorage.setItem('practice_text', content.text);
    sessionStorage.setItem('practice_source', 'ai');
    sessionStorage.setItem('practice_title', content.title || 'AI Practice');
    
    // Store CEFR and practice goal for future features
    if (content.cefrLevel) {
      sessionStorage.setItem('practice_cefr', content.cefrLevel);
    }
    if (content.practiceGoal) {
      sessionStorage.setItem('practice_goal', content.practiceGoal);
    }
    if (content.keyVocabulary) {
      sessionStorage.setItem('practice_vocabulary', JSON.stringify(content.keyVocabulary));
    }
    if (content.suggestedBlankWords) {
      sessionStorage.setItem('practice_blanks', JSON.stringify(content.suggestedBlankWords));
    }
    
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

        <AIGenerator
          onGenerate={handleGenerate}
          onSelect={handleSelect}
          generatedContent={generatedContent}
          isGenerating={isGenerating}
          error={error}
          onErrorDismiss={() => setError(null)}
        />
      </main>
    </div>
  );
}