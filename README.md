# TypeLearn — English Typing Practice Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Zustand-5.0-5c2d3e?style=for-the-badge" alt="Zustand">
</p>

## Overview

TypeLearn is a premium web application for practicing English typing through real content. Inspired by Monkeytype's fluid typing experience, it combines typing practice with educational features including vocabulary lookup, progress tracking, and flexible content sources.

### Problem It Solves

English learners need contextual typing practice with real content, not just random words. TypeLearn allows users to:
- Practice typing with their own PDFs (academic papers, articles, books)
- Generate custom practice content with AI assistance
- Look up vocabulary definitions while typing
- Track progress over time

### Target Users
- English learners (B1-C2 proficiency)
- Typing practice enthusiasts
- Students using academic PDFs
- Professionals improving business English

---

## Features

### Core Features
- **PDF Import**: Upload and extract text from PDF documents with section detection
- **AI Text Generation**: Generate custom practice text based on level, category, and length
- **Manual Text Input**: Type or paste custom text for practice
- **Real-time Typing Engine**: Character-by-character validation with instant feedback
- **Live Metrics**: WPM, accuracy, errors, and time tracking
- **Vocabulary Lookup**: Click on any word to see Spanish translations
- **Progress History**: Track sessions with detailed statistics
- **Keyboard Shortcuts**: Quick actions for power users

### Practice Modes
1. **PDF Mode**: Extract text from uploaded PDFs
2. **AI Mode**: Generate contextual practice text
3. **Manual Mode**: Use your own text content

### UX Polish
- Premium dark theme with carefully crafted color palette
- Smooth animations and micro-interactions
- Responsive design for desktop, tablet, and mobile
- Accessible focus states and reduced-motion support
- Empty states and error handling throughout

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16.2.4 (App Router) |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | v4 |
| State Management | Zustand | 5.0.12 |
| PDF Parsing | pdfjs-dist | 5.6.205 |
| Icons | Lucide React | 1.8.0 |
| Utilities | clsx + tailwind-merge | latest |

### Fonts
- **Inter** — UI text and headings
- **JetBrains Mono** — Typing area and code

---

## Project Structure

```
type/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with fonts
│   │   ├── page.tsx              # Redirect to /home
│   │   ├── globals.css           # Global styles + Tailwind
│   │   ├── home/                 # Dashboard with practice modes
│   │   ├── pdf/                  # PDF upload and section selection
│   │   ├── ai/                   # AI text generation
│   │   ├── manual/               # Manual text input
│   │   ├── practice/             # Typing session (core)
│   │   ├── history/              # Session history
│   │   └── settings/             # User preferences
│   │
│   ├── components/
│   │   ├── ui/                   # Primitive components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── EmptyState.tsx    # New in FASE 3
│   │   │   ├── ErrorBanner.tsx   # New in FASE 3
│   │   │   └── LoadingSkeleton.tsx # New in FASE 3
│   │   │
│   │   ├── layout/
│   │   │   └── Header.tsx
│   │   │
│   │   └── features/
│   │       ├── typing/
│   │       │   ├── TypingArea.tsx
│   │       │   └── MetricsBar.tsx
│   │       ├── pdf/
│   │       │   ├── PdfUploader.tsx
│   │       │   └── SectionSelector.tsx
│   │       ├── ai/
│   │       │   └── AIGenerator.tsx
│   │       └── vocabulary/
│   │           └── WordDefinitionPanel.tsx
│   │
│   ├── features/                 # Feature-specific hooks
│   │   └── typing/
│   │       └── hooks/
│   │           └── useTypingEngine.ts
│   │
│   ├── services/                 # External integrations
│   │   ├── pdf-parser/
│   │   │   ├── index.ts
│   │   │   └── normalizer.ts
│   │   ├── vocabulary-service/
│   │   │   ├── index.ts
│   │   │   └── dictionary.ts      # ~270 words
│   │   └── ai-service/
│   │       ├── index.ts           # Client adapter for /api/ai/generate
│   │       └── mocks.ts           # Legacy templates
│   │
│   ├── store/                    # Zustand stores
│   │   ├── useSessionStore.ts
│   │   ├── useHistoryStore.ts
│   │   └── useSettingsStore.ts
│   │
│   ├── hooks/                    # Shared hooks
│   │   ├── useKeyboardShortcuts.ts # New in FASE 3
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── cn.ts                 # clsx + tailwind-merge
│   │   ├── metrics.ts            # WPM/accuracy calculations
│   │   └── storage.ts            # localStorage utilities
│   │
│   ├── constants/
│   │   └── theme.ts              # Design tokens
│   │
│   └── types/
│       └── index.ts              # TypeScript definitions
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── SPEC.md                       # Full product specification
└── README.md                     # This file
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
cd type

# Install dependencies
npm install

# Configure server env vars
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Environment Variables

AI generation now runs through a secure Next.js server endpoint (`/api/ai/generate`) that calls Groq.

Required:

```bash
GROQ_API_KEY=gsk_...
```

Optional:

```bash
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TIMEOUT_MS=15000
```

Notes:
- `GROQ_API_KEY` is server-only. Do not expose it in client code or `NEXT_PUBLIC_*` vars.
- Use `.env.local` for local development.

---

## Key Technical Decisions

### 1. Local-First Architecture

All data is persisted locally using `localStorage`. This allows:
- Zero setup for users
- Instant data access
- No backend infrastructure needed

```typescript
// Example: Session storage keys
- typelearn_history      // Last 50 sessions
- typelearn_recent_words // Last 50 vocabulary lookups
- typelearn_settings     // User preferences
```

### 2. Typing Engine as State Machine

The typing validation logic is completely decoupled from UI:

```typescript
type TypingStatus = 'idle' | 'active' | 'completed';

interface CharacterState {
  char: string;
  status: 'pending' | 'correct' | 'incorrect' | 'current';
}
```

**States:**
- `idle`: Waiting for user to start
- `active`: User is typing, metrics updating
- `completed`: Test finished, show results

### 3. PDF Parsing with Normalization

PDF text extraction requires cleanup:

```typescript
// Normalization pipeline:
1. Remove excessive whitespace
2. Join hyphenated line breaks
3. Preserve paragraph structure
4. Create sections if no chapters detected
```

### 4. Service Adapter Pattern

All external services follow the same interface, making future integration straightforward:

```typescript
// Vocabulary Service Interface
interface VocabularyService {
  lookupWord(word: string): Promise<WordDefinition | null>;
}

// AI Service Interface  
interface AIService {
  generateText(params: GenerateParams): Promise<GeneratedContent>;
}
```

---

## How It Works

### PDF Flow

```
1. User uploads PDF
2. pdfjs-dist extracts raw text
3. Normalizer cleans and structures content
4. SectionSelector shows available sections
5. User selects section → practice text stored in sessionStorage
6. Navigate to /practice with text
```

### Typing Engine Flow

```
1. Text loaded from sessionStorage
2. Characters array created with 'pending' status
3. Hidden input captures keystrokes
4. Each character validated against expected
5. Status updates: pending → current → correct/incorrect
6. Metrics calculated in real-time
7. On completion → save to history
```

### AI Generation Flow

```
1. User selects: level (beginner/intermediate/advanced)
               category (daily-life, office, technology, etc.)
               length (short/medium/long)
2. Mock service returns pre-written template
3. Content preview shown
4. User confirms → stored in sessionStorage
5. Navigate to /practice
```

### Vocabulary Lookup Flow

```
1. User clicks on word in typing area
2. WordDefinitionPanel opens
3. Dictionary service looks up translation
4. Result displayed with:
   - Original word
   - Part of speech
   - Spanish translation
   - Example sentence (if available)
5. Word saved to recent history
```

---

## Data Persistence

### LocalStorage Usage

| Key | Data | Description |
|-----|------|-------------|
| `typelearn_history` | Session[] | Last 50 practice sessions |
| `typelearn_recent_words` | StoredWord[] | Last 50 vocabulary lookups |
| `typelearn_settings` | AppSettings | User preferences |

### Session Storage

Used for passing data between pages:
- `practice_text` — Current text to type
- `practice_source` — Source type (pdf/ai/manual)
- `practice_title` — Display title

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `R` | Restart test |
| `H` | Go to home |
| `V` | Toggle vocabulary panel |
| `/` | Focus typing area |
| `Esc` | Close modal / cancel |
| `Tab` | Next section (when applicable) |

Press the keyboard icon in practice mode for full help.

---

## Current Limitations

- **PDF Support**: Only text-based PDFs (no OCR for scanned documents)
- **AI Generation**: Mock service with pre-written templates (see Future Integrations)
- **Vocabulary**: ~270 words in mock dictionary
- **Storage**: Local-only (no cloud sync)
- **Authentication**: No user accounts (local data only)
- **Platform**: Web only (no mobile app)

---

## Accessibility

- Full keyboard navigation support
- ARIA labels on interactive elements
- Focus indicators on all controls
- `prefers-reduced-motion` support for animations
- Semantic HTML structure
- High contrast dark theme (WCAG AA compliant)

---

## Future Integrations

See [INTEGRATIONS.md](./INTEGRATIONS.md) for detailed roadmap.

### Priority Integrations

1. **Real AI Service** — OpenAI GPT-4 or Anthropic Claude
2. **Dictionary API** — Real translation service
3. **Cloud Sync** — User accounts with cloud persistence
4. **OCR Support** — Process scanned PDFs

### File Format Support

- EPUB reader
- Plain text (.txt) import
- Word documents (.docx)

---

## Contributing

This is a personal project for portfolio/learning purposes. However, suggestions and feedback are welcome.

### Development Workflow

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Type check
npm run type-check

# Build
npm run build
```

---

## License

MIT License — Feel free to use for learning or personal projects.

---

## Credits

- Inspired by [Monkeytype](https://monkeytype.com/)
- UI/UX influenced by [Linear](https://linear.app/) and [Vercel](https://vercel.com/)
- Icons by [Lucide](https://lucide.dev/)

---

<p align="center">
  <strong>TypeLearn</strong> — Master English Through Focused Typing Practice
</p>
