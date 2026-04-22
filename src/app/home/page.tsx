'use client';

import Link from 'next/link';
import { FileText, Sparkles, PenLine, ArrowRight, Clock, TrendingUp, BookOpen } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';

const modes = [
  {
    id: 'pdf',
    title: 'PDF Practice',
    description: 'Upload a PDF document and practice typing its content',
    icon: FileText,
    href: '/pdf',
    color: 'from-red-500/20 to-orange-500/20',
    iconColor: 'text-red-400',
  },
  {
    id: 'ai',
    title: 'AI Generation',
    description: 'Generate custom practice text with AI assistance',
    icon: Sparkles,
    href: '/ai',
    color: 'from-purple-500/20 to-blue-500/20',
    iconColor: 'text-purple-400',
  },
  {
    id: 'manual',
    title: 'Manual Text',
    description: 'Type or paste your own text for practice',
    icon: PenLine,
    href: '/manual',
    color: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage="home" />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 mb-6">
              <TrendingUp className="w-3 h-3" />
              <span>Improve your typing speed and learn vocabulary</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-zinc-100 mb-6 tracking-tight">
              Master English Through
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Focused Typing Practice
              </span>
            </h1>
            
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Practice typing in English with real content from your documents. 
              Track your progress, learn vocabulary, and improve accuracy.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/pdf">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" size="lg" className="gap-2">
                  <Clock className="w-4 h-4" />
                  View History
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Modes */}
        <section className="py-12 px-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-zinc-100 mb-8 text-center">
              Choose Your Practice Mode
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modes.map((mode) => (
                <Link
                  key={mode.id}
                  href={mode.href}
                  className="group relative p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Gradient background */}
                  <div className={cn(
                    'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                    mode.color
                  )} />
                  
                  <div className="relative">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
                      'bg-zinc-800 group-hover:bg-zinc-700 transition-colors',
                      mode.color.replace('from-', 'bg-').split(' ')[0]
                    )}>
                      <mode.icon className={cn('w-6 h-6', mode.iconColor)} />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                      {mode.title}
                    </h3>
                    
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 px-6 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-medium text-zinc-100 mb-1">Track Progress</h3>
                <p className="text-sm text-zinc-500">
                  Monitor WPM, accuracy, and errors in real-time
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-medium text-zinc-100 mb-1">Learn Vocabulary</h3>
                <p className="text-sm text-zinc-500">
                  Click on words to see Spanish translations
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-medium text-zinc-100 mb-1">Practice Anywhere</h3>
                <p className="text-sm text-zinc-500">
                  Use your own PDFs or AI-generated content
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto text-center text-sm text-zinc-600">
          <p>TypeLearn — Practice typing, learn vocabulary</p>
        </div>
      </footer>
    </div>
  );
}