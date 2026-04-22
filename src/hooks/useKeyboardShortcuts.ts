'use client';

import { useEffect, useCallback, useRef } from 'react';

type KeyboardShortcutHandler = (event: KeyboardEvent) => void;

interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  handler: KeyboardShortcutHandler;
  enabled?: () => boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutDefinition[];
  enabled?: boolean;
}

// Common shortcut definitions for the app
export const APP_SHORTCUTS = {
  RESTART: 'r',
  HOME: 'h',
  VOCABULARY: 'v',
  NEW_AI: 'n',
  FOCUS_TEST: '/',
  ESCAPE: 'Escape',
  TAB: 'Tab',
} as const;

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input/textarea (except for global shortcuts)
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      const { key, ctrl, meta, shift, alt, handler, enabled: isEnabled } = shortcut;

      // Check if shortcut should be enabled
      if (isEnabled && !isEnabled()) continue;

      // For non-modifier keys, ignore if focused on input unless explicitly allowed
      if (isInput && !ctrl && !meta && !alt) continue;

      const keyMatch = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        handler(event);
        return;
      }
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Hook to provide global keyboard shortcuts context
export function useGlobalShortcuts() {
  return {
    [APP_SHORTCUTS.RESTART]: 'Restart test',
    [APP_SHORTCUTS.HOME]: 'Go to home',
    [APP_SHORTCUTS.VOCABULARY]: 'Toggle vocabulary panel',
    [APP_SHORTCUTS.NEW_AI]: 'Generate new AI text',
    [APP_SHORTCUTS.FOCUS_TEST]: 'Focus typing area',
    [APP_SHORTCUTS.ESCAPE]: 'Close modal / Cancel',
    [APP_SHORTCUTS.TAB]: 'Navigate sections',
  };
}

// Keyboard shortcuts help modal content
export const SHORTCUTS_HELP = [
  { key: 'R', description: 'Restart test' },
  { key: 'H', description: 'Go to home' },
  { key: 'V', description: 'Toggle vocabulary panel' },
  { key: 'N', description: 'Generate new AI text' },
  { key: '/', description: 'Focus typing area' },
  { key: 'Esc', description: 'Close modal / Cancel' },
  { key: 'Tab', description: 'Next section' },
  { key: 'Shift + Tab', description: 'Previous section' },
];
