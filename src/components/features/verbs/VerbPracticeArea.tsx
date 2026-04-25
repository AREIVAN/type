'use client';

import { KeyboardEvent, RefObject, useEffect } from 'react';
import { VerbPracticeAnswerResult, VerbPracticeItem } from '@/types';
import { mapVerbTypingCharacters } from '@/features/verb-practice/helpers';
import { cn } from '@/utils/cn';

interface VerbPracticeAreaProps {
  items: VerbPracticeItem[];
  currentIndex: number;
  inputValue: string;
  results: Record<string, VerbPracticeAnswerResult>;
  inputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onBackspace: () => void;
  onSubmitCurrent: () => void;
}

export function VerbPracticeArea({
  items,
  currentIndex,
  inputValue,
  results,
  inputRef,
  onInputChange,
  onBackspace,
  onSubmitCurrent,
}: VerbPracticeAreaProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSubmitCurrent();
      return;
    }

    if (event.key === 'Backspace' && inputValue.length === 0) {
      event.preventDefault();
      onBackspace();
    }
  };

  const isDone = currentIndex >= items.length;

  useEffect(() => {
    if (!isDone) {
      inputRef.current?.focus();
    }
  }, [inputRef, isDone, items]);

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 md:p-6">
      <div>
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">ENGLISH VERBS</p>
          <p className="text-sm text-zinc-500">Type the verbs in order.</p>
        </div>

        <div
          role="textbox"
          tabIndex={0}
          className="block w-full cursor-text rounded-xl border border-transparent bg-zinc-950/20 px-1 py-2 text-left focus:outline-none focus-visible:border-cyan-400/50"
          onClick={() => inputRef.current?.focus()}
          onFocus={() => inputRef.current?.focus()}
          aria-label="Verb typing area"
        >
          <input
            ref={inputRef}
            value={inputValue}
            onChange={event => onInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={isDone}
            className="sr-only"
            aria-label="Type verbs in order"
          />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-3xl font-semibold leading-relaxed tracking-tight md:text-5xl">
          {items.map((item, index) => {
            const result = results[item.id];
            const isCurrent = index === currentIndex && !isDone;
            const typedValue = isCurrent ? inputValue : result?.answer ?? '';
            const characters = mapVerbTypingCharacters(item.text, typedValue, { active: isCurrent });

            return (
              <span key={item.id} className="inline-flex items-center gap-2">
                <span
                  className={cn(
                    'relative rounded-md px-0.5 py-1 transition-colors',
                    isCurrent && 'bg-zinc-800/55 text-zinc-200',
                    !isCurrent && !result && 'text-zinc-600'
                  )}
                >
                  {characters.map((character, characterIndex) => (
                    <span
                      key={`${item.id}-${characterIndex}`}
                      className={cn(
                        'relative inline-block min-w-[0.45ch]',
                        character.status === 'correct' && 'text-emerald-400',
                        character.status === 'incorrect' && 'text-red-400',
                        character.status === 'extra' && 'text-red-300 bg-red-500/15 rounded-sm',
                        character.status === 'pending' && 'text-zinc-600',
                        character.status === 'current' && 'text-zinc-400 before:absolute before:-left-0.5 before:top-1 before:h-[1.15em] before:w-px before:bg-cyan-300 before:content-[""]'
                      )}
                    >
                      {character.character}
                    </span>
                  ))}
                  {isCurrent && typedValue.length >= item.text.length && (
                    <span className="ml-0.5 inline-block h-[1.15em] w-px translate-y-1 bg-cyan-300" aria-hidden="true" />
                  )}
                </span>
                {index < items.length - 1 && <span className="text-zinc-700">·</span>}
              </span>
            );
          })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Spanish meaning</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-500">
          {items.map(item => (
            <span key={item.id}>
              <span className="text-zinc-400">{item.text}</span> <span className="text-zinc-700">—</span> {item.translationEs}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
