# TypeLearn — Product Specification

**Version**: 1.0.0 (MVP)  
**Status**: Architecture & Plan  
**Last Updated**: 2026-04-22

---

## 1. Product Summary

### Name
**TypeLearn** — English Typing Practice Platform

### Purpose
A premium web application where users practice English typing by transcribing exact text from PDFs, manual input, or AI-generated paragraphs. Combines Monkeytype's fluid typing experience with educational features: vocabulary lookup (Spanish translations), progress tracking, and content flexibility.

### Target Users
- English learners (B1-C2)
- Typing practice enthusiasts
- Students using academic PDFs
- Professionals improving business English

---

## 2. Architecture Overview

### Stack Selection

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | Server components, SSR, file-based routing |
| Language | TypeScript (strict) | Type safety, better DX |
| Styling | Tailwind CSS v4 | Speed, consistency, premium tokens |
| State | Zustand | Lightweight, scalable, great devtools |
| PDF Parsing | pdfjs-dist | Robust, widely maintained |
| Storage | localStorage + IndexedDB | Local-first, no backend required |
| Icons | Lucide React | Clean, consistent, tree-shakeable |

### Architecture Pattern
**Feature-Sliced Architecture** (simplified)

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Shared UI components
│   ├── ui/                # Primitive components (Button, Input, Card)
│   └── layout/            # Layout components (Header, Sidebar)
├── features/              # Feature modules
│   ├── home/
│   ├── typing/
│   ├── pdf-import/
│   ├── ai-generation/
│   ├── vocabulary/
│   └── history/
├── services/               # External integrations
│   ├── pdf-parser/
│   ├── ai-service/
│   └── vocabulary-service/
├── store/                  # Zustand stores
├── types/                  # TypeScript type definitions
├── utils/                  # Shared utilities
└── constants/              # App constants
```

### Key Architectural Decisions

1. **Local-First**: No backend required for MVP. All data persisted locally.
2. **Feature Isolation**: Each feature has its own domain logic, UI components, and hooks.
3. **Service Adapter Pattern**: PDF, AI, and Vocabulary services have clean interfaces ready for real API replacement.
4. **Typing Engine as Core Domain**: The typing validation logic is completely decoupled from UI.

---

## 3. Technical Decisions Detail

### PDF Parsing Strategy
- Use `pdfjs-dist` for text extraction
- Build a **Normalization Layer** that:
  - Removes excessive whitespace
  - Joins hyphenated line breaks
  - Preserves paragraphs and punctuation
  - Creates artificial sections if no chapters detected

### Typing Engine Design
- **State Machine** approach with clear states: `idle` | `active` | `paused` | `completed`
- **Character-by-character validation** against target text
- **Metrics calculation**: WPM, accuracy, errors in real-time
- **Input handling**: Controlled input field (hidden or visible based on UX decision)

### AI Service Layer
- **Mock-first approach** with high-quality templates
- **Interface**: `generateText(params: GenerateParams): Promise<GeneratedContent>`
- **Prepared for**: OpenAI API, Anthropic, or local LLM

### Vocabulary Lookup
- **Click-to-define** interaction on words
- **Mock dictionary** with ~500 common words for demo
- **Adapter pattern** for future Dictionary API integration

---

## 4. Folder Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home (redirect to /home)
│   ├── home/
│   │   └── page.tsx            # Main dashboard
│   ├── practice/
│   │   └── [sessionId]/
│   │       └── page.tsx        # Typing practice session
│   ├── pdf/
│   │   └── page.tsx            # PDF upload & section selection
│   ├── ai/
│   │   └── page.tsx            # AI text generation
│   └── history/
│       └── page.tsx            # Session history
├── components/
│   ├── ui/                     # Primitive components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   └── Tooltip.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── features/               # Feature-specific components
│       ├── TypingArea.tsx
│       ├── MetricsBar.tsx
│       ├── PdfUploader.tsx
│       ├── SectionSelector.tsx
│       ├── WordDefinition.tsx
│       └── AIGenerator.tsx
├── features/
│   ├── home/
│   │   └── components/
│   ├── typing/
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── useTypingEngine.ts
│   │   └── types/
│   ├── pdf-import/
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── usePdfParser.ts
│   │   └── types/
│   ├── ai-generation/
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── useAIGenerator.ts
│   │   └── types/
│   ├── vocabulary/
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── useVocabulary.ts
│   │   └── types/
│   └── history/
│       ├── components/
│       ├── hooks/
│       │   └── useHistory.ts
│       └── types/
├── services/
│   ├── pdf-parser/
│   │   ├── index.ts            # Main parser service
│   │   └── normalizer.ts       # Text normalization
│   ├── ai-service/
│   │   ├── index.ts            # AI generation service
│   │   └── mocks.ts            # Mock data
│   └── vocabulary-service/
│       ├── index.ts            # Dictionary service
│       └── dictionary.ts       # Mock dictionary
├── store/
│   ├── useSessionStore.ts      # Current typing session
│   ├── useHistoryStore.ts      # Session history
│   └── useSettingsStore.ts     # User preferences
├── types/
│   ├── index.ts               # Global types
│   ├── session.ts              # Session types
│   ├── pdf.ts                  # PDF types
│   └── ai.ts                   # AI types
├── utils/
│   ├── cn.ts                   # classnames utility
│   ├── storage.ts              # localStorage/IndexedDB helpers
│   └── metrics.ts              # WPM/accuracy calculations
└── constants/
    ├── theme.ts                # Colors, spacing, typography
    └── config.ts               # App configuration
```

---

## 5. Phased Implementation Plan

### FASE 1: Core Platform (Priority: Critical)
- [ ] Project setup (Next.js + Tailwind + TypeScript)
- [ ] Layout and routing structure
- [ ] Home page with mode selection
- [ ] PDF upload component with drag-and-drop
- [ ] PDF text extraction using pdfjs-dist
- [ ] Text normalizer service
- [ ] Section/page selector UI
- [ ] Typing engine (character validation, state machine)
- [ ] Real-time metrics (WPM, accuracy, errors, time)
- [ ] Results screen with summary
- [ ] Session persistence (localStorage)

### FASE 2: Feature Expansion (Priority: High)
- [ ] AI text generation UI
- [ ] AI mock service with quality templates
- [ ] Level/category/length selectors
- [ ] Vocabulary lookup panel
- [ ] Click-to-define word interaction
- [ ] Recently viewed words
- [ ] History page with session list
- [ ] Settings panel (text size, panel visibility)

### FASE 3: Polish & Refinement (Priority: Medium)
- [ ] Empty states for all features
- [ ] Error states with clear messaging
- [ ] Loading states and skeletons
- [ ] Responsive design improvements
- [ ] Keyboard shortcuts
- [ ] Animations and micro-interactions
- [ ] README documentation
- [ ] Production build verification

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF text extraction fails on scanned docs | High | Clear error message, suggest OCR tool |
| Typing lag on long texts | Medium | Use requestAnimationFrame, optimize re-renders |
| Large PDF crashes browser | Medium | Limit to 50MB, paginate extraction |
| AI mock feels unnatural | Low | Curate quality templates, prepare real API |
| LocalStorage fills up | Low | Implement cleanup, use IndexedDB for large data |

---

## 7. Visual Design Direction

### Theme
- **Dark mode default** (inspired by Vercel, Linear)
- Background: `#0a0a0a` to `#111111`
- Surface: `#18181b` to `#1f1f23`
- Accent: `#3b82f6` (blue) for primary actions
- Success: `#22c55e` (green) for correct characters
- Error: `#ef4444` (red) for incorrect characters
- Text Primary: `#fafafa`
- Text Secondary: `#a1a1aa`
- Text Muted: `#71717a`

### Typography
- **Font Family**: Inter (system fallback: -apple-system, sans-serif)
- **Typing Text**: JetBrains Mono (monospace for accuracy)
- **Headings**: Inter, 600-700 weight
- **Body**: Inter, 400 weight
- **Size Scale**: 12px, 14px, 16px, 18px, 20px, 24px, 32px, 48px

### Spacing System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96

### Component Style
- Rounded corners: 6px (small), 8px (medium), 12px (large)
- Subtle borders: 1px solid `#27272a`
- Shadows: Minimal, only on elevated elements
- Focus rings: 2px offset, accent color

### Layout Principles
- Max content width: 800px (typing area)
- Centered layout with generous whitespace
- Sidebar for vocabulary: 320px, collapsible
- Header: 64px height, minimal
- Mobile: Full-width, stacked layout

---

## 8. Assumptions & Constraints

### Assumptions
- Users have modern browsers (Chrome, Firefox, Safari, Edge)
- PDFs will be text-selectable (no OCR needed for MVP)
- Primary use case: desktop/laptop with keyboard
- Users prefer dark theme

### Constraints
- No backend required for MVP
- No authentication required
- No real-time collaboration
- No mobile app in this version
- No audio/voice features

---

## 9. API Contracts (Prepared for Future)

### AI Generation
```typescript
interface GenerateParams {
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'daily-life' | 'office' | 'technology' | 'travel' | 'stories' | 'general';
  length: 'short' | 'medium' | 'long';
}

interface GeneratedContent {
  id: string;
  title?: string;
  text: string;
  level: string;
  category: string;
  createdAt: Date;
}
```

### Vocabulary Lookup
```typescript
interface WordDefinition {
  word: string;
  translation: string;
  definition: string;
  example?: string;
  partOfSpeech: string;
}
```

---

## 10. Success Criteria

The MVP is complete when:
1. User can upload PDF and extract text by section/page
2. User can practice typing with real-time validation and metrics
3. User can generate AI text by parameters
4. User can look up word meanings on click
5. User can view history of sessions
6. UI feels premium, fast, and focused
7. Code is modular and maintainable
8. README provides clear setup instructions

---

*This spec serves as the source of truth for implementation. All changes must be documented here before coding.*
