'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { AIGenerator } from '@/components/features/ai/AIGenerator';
import { generatePracticeText } from '@/services/ai-service';
import { CEFRLevel, Length, GeneratedContent, SpanishHints, BlanksMode, PracticeObjective, PracticeTopic, AISessionMetadata } from '@/types';

export default function AIPage() {
  const router = useRouter();
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (params: { 
    cefrLevel: CEFRLevel; 
    topic: PracticeTopic;
    objective: PracticeObjective;
    length: Length;
    useWeakWords: boolean;
    weakWords: string[];
    learningSupport?: { spanishHints: SpanishHints; blanksMode: BlanksMode };
  }) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const content = await generatePracticeText({
        cefrLevel: params.cefrLevel,
        topic: params.topic,
        objective: params.objective,
        length: params.length,
        useWeakWords: params.useWeakWords,
        weakWords: params.weakWords,
        learningSupport: params.learningSupport,
      });
      setGeneratedContent(content);
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError('Failed to generate content. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleSelect = useCallback((content: GeneratedContent) => {
    // Store practice text and metadata
    sessionStorage.setItem('practice_text', content.text);
    sessionStorage.setItem('practice_source', 'ai');
    sessionStorage.setItem('practice_title', content.title || 'AI Practice');
    const metadata: AISessionMetadata = {
      type: 'ai',
      generationSource: content.generationSource ?? 'ai',
      cefrLevel: content.cefrLevel ?? 'B1',
      topic: content.topic ?? 'daily-conversation',
      objective: content.objective ?? 'reading-fluency',
      weakWordsUsed: content.weakWordsUsed ?? [],
      technicalVocabularyUsed: content.technicalVocabularyUsed ?? [],
      textLength: content.length ?? 'medium',
      title: content.title || 'AI Practice',
    };
    sessionStorage.setItem('practice_metadata', JSON.stringify(metadata));
    
    // Store CEFR and practice goal for future features
    if (content.cefrLevel) {
      sessionStorage.setItem('practice_cefr', content.cefrLevel);
    }
    if (content.objective) {
      sessionStorage.setItem('practice_goal', content.objective);
    }
    if (content.keywordsUsed) {
      sessionStorage.setItem('practice_vocabulary', JSON.stringify(content.keywordsUsed));
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
        />
      </main>
    </div>
  );
}
