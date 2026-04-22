'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Type, Volume2, BookOpen } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function SettingsPage() {
  const { textSize, showVocabulary, soundEnabled, load, update, reset } = useSettingsStore();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage="settings" />
      
      <main className="flex-1 py-12 px-6">
        {/* Back button */}
        <div className="max-w-2xl mx-auto mb-8">
          <Link 
            href="/home"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-100 mb-8">
            Settings
          </h1>

          <div className="space-y-6">
            {/* Text Size */}
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="font-medium text-zinc-100">Text Size</p>
                    <p className="text-sm text-zinc-500">Adjust the typing area font size</p>
                  </div>
                </div>
                <span className="text-sm text-zinc-400">{textSize}px</span>
              </div>
              
              <input
                type="range"
                min="14"
                max="28"
                value={textSize}
                onChange={(e) => update({ textSize: parseInt(e.target.value) })}
                className="w-full accent-blue-500"
              />
              
              <div className="flex justify-between mt-2">
                <span className="text-xs text-zinc-600">14px</span>
                <span className="text-xs text-zinc-600">28px</span>
              </div>
            </div>

            {/* Vocabulary Panel */}
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="font-medium text-zinc-100">Vocabulary Panel</p>
                    <p className="text-sm text-zinc-500">Show word definition panel during practice</p>
                  </div>
                </div>
                
                <button
                  onClick={() => update({ showVocabulary: !showVocabulary })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    showVocabulary ? 'bg-blue-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      showVocabulary ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Sound */}
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="font-medium text-zinc-100">Sound Effects</p>
                    <p className="text-sm text-zinc-500">Play sounds on keypress (coming soon)</p>
                  </div>
                </div>
                
                <button
                  onClick={() => update({ soundEnabled: !soundEnabled })}
                  disabled
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    soundEnabled ? 'bg-blue-500' : 'bg-zinc-700'
                  } opacity-50 cursor-not-allowed`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      soundEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Reset */}
            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={reset}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Reset all settings to defaults
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}