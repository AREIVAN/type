import { create } from 'zustand';
import { StoredSession, getHistory as loadHistory, saveSession as persistSession, clearHistory as clearStoredHistory } from '@/utils/storage';

interface HistoryState {
  sessions: StoredSession[];
  load: () => void;
  add: (session: Omit<StoredSession, 'completedAt'>) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  sessions: [],
  
  load: () => {
    const sessions = loadHistory();
    set({ sessions });
  },
  
  add: (session) => {
    const storedSession: StoredSession = {
      ...session,
      completedAt: new Date().toISOString(),
    };
    persistSession(storedSession);
    const sessions = get().sessions;
    set({ sessions: [storedSession, ...sessions].slice(0, 50) });
  },
  
  clear: () => {
    clearStoredHistory();
    set({ sessions: [] });
  },
}));
