'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { CharacterState } from '@/features/typing/hooks/useTypingEngine';
import { cn } from '@/utils/cn';
import { useSettingsStore } from '@/store/useSettingsStore';

interface TypingAreaProps {
  characters: CharacterState[];
  status: 'idle' | 'active' | 'completed';
  onInput: (input: string) => void;
  onDelete?: () => void;
  allowCorrections?: boolean;
}

export function TypingArea({ characters, status, onInput, onDelete, allowCorrections = false }: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const textSize = useSettingsStore(s => s.textSize);

  // Auto-focus on mount and click
  useEffect(() => {
    if (status === 'idle' || status === 'active') {
      inputRef.current?.focus();
    }
  }, [status]);

  const handleClick = useCallback(() => {
    inputRef.current?.focus();
    setIsFocused(true);
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 0) {
      onInput(value);
      // Clear input after handling
      e.target.value = '';
    }
  }, [onInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      if (allowCorrections) {
        onDelete?.();
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (allowCorrections) {
        const currentCharIndex = characters.findIndex(c => c.status === 'current');
        const nextChar = characters[currentCharIndex];
        if (nextChar && nextChar.char === '\n') {
          onInput('\n');
        }
      }
      return;
    }
  }, [allowCorrections, onDelete, onInput, characters]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative w-full max-w-3xl mx-auto',
        'bg-zinc-900/50 rounded-xl border border-zinc-800',
        'transition-all duration-300',
        isFocused && 'border-zinc-700',
        !isFocused && status !== 'completed' && 'ring-2 ring-blue-500/20'
      )}
      onClick={handleClick}
    >
      {/* Hidden input for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        className="absolute inset-0 w-full h-full opacity-0 cursor-default"
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={status === 'completed'}
      />

      {/* Text display */}
      <div 
        className={cn(
          'font-mono leading-relaxed p-6',
          'whitespace-pre-wrap break-words',
        )}
        style={{ fontSize: `${textSize}px` }}
      >
        {characters.map((char, index) => {
          let className = '';
          
          switch (char.status) {
            case 'correct':
              className = 'text-emerald-400';
              break;
            case 'incorrect':
              className = 'text-red-400 bg-red-500/10 rounded px-0.5';
              break;
            case 'current':
              className = 'relative';
              break;
            default:
              className = 'text-zinc-500';
          }
          
          // Handle special characters
          let displayChar = char.char;
          if (char.char === '\n') {
            displayChar = '↵\n';
          } else if (char.char === ' ') {
            displayChar = '\u00A0'; // Non-breaking space for visibility
          }

          return (
            <span 
              key={index}
              className={cn(
                'transition-all duration-150',
                char.status === 'correct' && 'transform scale-100',
                char.status === 'incorrect' && 'transform scale-105',
                className
              )}
            >
              {char.status === 'current' && (
                <span className="relative">
                  <span className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-zinc-100 animate-pulse" />
                  <span className="bg-zinc-800/50 rounded px-0.5">
                    {displayChar}
                  </span>
                </span>
              )}
              {char.status !== 'current' && displayChar}
            </span>
          );
        })}
      </div>

      {/* Empty state hint */}
      {status === 'idle' && !isFocused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-zinc-500 text-sm">
            Click here and start typing...
          </span>
        </div>
      )}
    </div>
  );
}
