import { create } from 'zustand';
import { Session, SessionMetrics, SessionStatus, PdfSection, GeneratedContent } from '@/types';

interface SessionState {
  currentSession: Session | null;
  pdfSections: PdfSection[];
  aiContent: GeneratedContent | null;
  manualText: string;
  
  // Actions
  setSession: (session: Session) => void;
  setPdfSections: (sections: PdfSection[]) => void;
  setAiContent: (content: GeneratedContent | null) => void;
  setManualText: (text: string) => void;
  updateMetrics: (metrics: Partial<SessionMetrics>) => void;
  setStatus: (status: SessionStatus) => void;
  startSession: (text: string, source: 'pdf' | 'ai' | 'manual', sourceId?: string, title?: string) => void;
  endSession: () => void;
  reset: () => void;
}

const initialMetrics: SessionMetrics = {
  wpm: 0,
  accuracy: 100,
  errors: 0,
  totalChars: 0,
  correctChars: 0,
  time: 0,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  pdfSections: [],
  aiContent: null,
  manualText: '',
  
  setSession: (session) => set({ currentSession: session }),
  
  setPdfSections: (sections) => set({ pdfSections: sections }),
  
  setAiContent: (content) => set({ aiContent: content }),
  
  setManualText: (text) => set({ manualText: text }),
  
  updateMetrics: (metrics) => {
    const { currentSession } = get();
    if (!currentSession) return;
    set({
      currentSession: {
        ...currentSession,
        metrics: { ...currentSession.metrics, ...metrics },
      },
    });
  },
  
  setStatus: (status) => {
    const { currentSession } = get();
    if (!currentSession) return;
    set({
      currentSession: {
        ...currentSession,
        status,
        ...(status === 'completed' && { completedAt: new Date() }),
      },
    });
  },
  
  startSession: (text, source, sourceId, title) => {
    const session: Session = {
      id: `session_${Date.now()}`,
      source,
      sourceId,
      text,
      title,
      status: 'idle',
      metrics: { ...initialMetrics },
    };
    set({ currentSession: session });
  },
  
  endSession: () => {
    const { currentSession } = get();
    if (!currentSession) return;
    set({
      currentSession: {
        ...currentSession,
        status: 'completed',
        completedAt: new Date(),
      },
    });
  },
  
  reset: () => set({
    currentSession: null,
    pdfSections: [],
    aiContent: null,
    manualText: '',
  }),
}));
