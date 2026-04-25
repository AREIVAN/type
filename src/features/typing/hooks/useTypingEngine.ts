'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateWPM, calculateAccuracy } from '@/utils/metrics';

export interface CharacterState {
  char: string;
  status: 'pending' | 'correct' | 'incorrect' | 'current';
}

export interface TypingEngineState {
  characters: CharacterState[];
  currentIndex: number;
  status: 'idle' | 'active' | 'completed';
  metrics: {
    wpm: number;
    accuracy: number;
    errors: number;
    correctChars: number;
    totalChars: number;
    time: number;
  };
}

interface UseTypingEngineOptions {
  text: string;
  allowCorrections?: boolean;
  onComplete?: (metrics: TypingEngineState['metrics']) => void;
  onProgress?: (metrics: TypingEngineState['metrics'], progress: number) => void;
}

export function applyTypingCorrection(prev: TypingEngineState, text: string, elapsed: number): TypingEngineState {
  if (prev.currentIndex <= 0) return prev;

  const previousIndex = prev.currentIndex - 1;
  const previousCharacter = prev.characters[previousIndex];
  const newCharacters = [...prev.characters];

  if (prev.currentIndex < newCharacters.length) {
    newCharacters[prev.currentIndex] = {
      ...newCharacters[prev.currentIndex],
      status: 'pending',
    };
  }

  newCharacters[previousIndex] = {
    ...previousCharacter,
    status: 'current',
  };

  const newCorrectChars = previousCharacter.status === 'correct'
    ? Math.max(0, prev.metrics.correctChars - 1)
    : prev.metrics.correctChars;
  const newErrors = previousCharacter.status === 'incorrect'
    ? Math.max(0, prev.metrics.errors - 1)
    : prev.metrics.errors;
  const totalChars = text.length;
  const metrics = {
    wpm: calculateWPM(newCorrectChars, elapsed),
    accuracy: calculateAccuracy(newCorrectChars, newCorrectChars + newErrors),
    errors: newErrors,
    correctChars: newCorrectChars,
    totalChars,
    time: elapsed,
  };

  return {
    ...prev,
    characters: newCharacters,
    currentIndex: previousIndex,
    status: 'active',
    metrics,
  };
}

export function useTypingEngine({ text, allowCorrections = false, onComplete, onProgress }: UseTypingEngineOptions) {
  const [state, setState] = useState<TypingEngineState>(() => initializeState(text));
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletedRef = useRef(false);

  // Initialize state when text changes
  useEffect(() => {
    isCompletedRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the engine state must reset when a new practice text is loaded.
    setState(initializeState(text));
    startTimeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [text]);

  function initializeState(text: string): TypingEngineState {
    const characters: CharacterState[] = text.split('').map((char, index) => ({
      char,
      status: (index === 0 ? 'current' : 'pending') as CharacterState['status'],
    }));

    return {
      characters,
      currentIndex: 0,
      status: 'idle',
      metrics: {
        wpm: 0,
        accuracy: 100,
        errors: 0,
        correctChars: 0,
        totalChars: text.length,
        time: 0,
      },
    };
  }

  const updateMetrics = useCallback((correctChars: number, errors: number, time: number, totalChars: number) => {
    const wpm = calculateWPM(correctChars, time);
    const accuracy = calculateAccuracy(correctChars, correctChars + errors);
    return { wpm, accuracy, errors, correctChars, totalChars, time };
  }, []);

  const handleInput = useCallback((input: string) => {
    if (isCompletedRef.current) return;

    const { currentIndex, characters } = state;
    if (currentIndex >= characters.length) return;

    // Start timer on first input
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      
      // Start interval for time tracking
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current && !isCompletedRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setState(prev => {
            const newMetrics = updateMetrics(
              prev.metrics.correctChars,
              prev.metrics.errors,
              elapsed,
              prev.metrics.totalChars
            );
            const progress = prev.currentIndex / prev.metrics.totalChars;
            onProgress?.(newMetrics, progress);
            return {
              ...prev,
              metrics: newMetrics,
            };
          });
        }
      }, 100);
    }

    const currentChar = characters[currentIndex];
    const typedChar = input.slice(-1); // Get the last character typed
    const isCorrect = typedChar === currentChar.char;

    setState(prev => {
      const newCharacters = [...prev.characters];
      newCharacters[currentIndex] = {
        ...newCharacters[currentIndex],
        status: isCorrect ? 'correct' : 'incorrect',
      };

      const newCorrectChars = isCorrect ? prev.metrics.correctChars + 1 : prev.metrics.correctChars;
      const newErrors = isCorrect ? prev.metrics.errors : prev.metrics.errors + 1;
      const newIndex = currentIndex + 1;

      // Check completion
      if (newIndex >= text.length) {
        isCompletedRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        const finalTime = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;
        const finalMetrics = updateMetrics(newCorrectChars, newErrors, finalTime, text.length);
        
        // Mark last character as current for visual
        if (newIndex > 0 && newCharacters[newIndex - 1]) {
          // Keep as correct/incorrect, don't change
        }

        setTimeout(() => {
          onComplete?.(finalMetrics);
        }, 0);

        return {
          ...prev,
          characters: newCharacters,
          currentIndex: newIndex,
          status: 'completed',
          metrics: finalMetrics,
        };
      }

      // Mark next character as current
      if (newIndex < newCharacters.length) {
        newCharacters[newIndex] = {
          ...newCharacters[newIndex],
          status: 'current',
        };
      }

      const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;
      const newMetrics = updateMetrics(newCorrectChars, newErrors, elapsed, text.length);
      const progress = newIndex / text.length;

      onProgress?.(newMetrics, progress);

      return {
        ...prev,
        characters: newCharacters,
        currentIndex: newIndex,
        status: 'active',
        metrics: newMetrics,
      };
    });
  }, [state, text, onComplete, onProgress, updateMetrics]);

  const handleDelete = useCallback(() => {
    if (!allowCorrections || isCompletedRef.current) return;

    setState(prev => {
      const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : prev.metrics.time;
      const next = applyTypingCorrection(prev, text, elapsed);
      if (next === prev) return prev;

      const progress = next.currentIndex / text.length;
      onProgress?.(next.metrics, progress);

      return next;
    });
  }, [allowCorrections, onProgress, text]);

  const reset = useCallback(() => {
    isCompletedRef.current = false;
    startTimeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(initializeState(text));
  }, [text]);

  const restart = useCallback(() => {
    reset();
  }, [reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    handleInput,
    handleDelete,
    reset,
    restart,
  };
}
