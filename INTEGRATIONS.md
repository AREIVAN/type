# Future Integrations Guide

This document outlines how to integrate real services into TypeLearn. All the mock services are designed with the adapter pattern to make switching to real APIs straightforward.

---

## 1. AI Service Integration

### Current State

The AI service (`src/services/ai-service/mocks.ts`) provides pre-written templates across:
- **Levels**: beginner, intermediate, advanced
- **Categories**: daily-life, office, technology, travel, stories, general
- **Lengths**: short (~50 words), medium (~100 words), long (~200 words)

### Integration Steps

#### Option A: OpenAI GPT-4

```typescript
// src/services/ai-service/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateParams {
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  length: 'short' | 'medium' | 'long';
}

export async function generatePracticeText(params: GenerateParams) {
  const lengthMap = {
    short: '50-75 words',
    medium: '100-150 words',
    long: '200-300 words',
  };
  
  const levelInstructions = {
    beginner: 'Use simple vocabulary and short sentences.',
    intermediate: 'Use moderate vocabulary and varied sentence structures.',
    advanced: 'Use sophisticated vocabulary and complex sentences.',
  };

  const prompt = `Generate a ${params.level}-level English text about ${params.category}. 
Target length: ${lengthMap[params.length]}.
${levelInstructions[params.level]}
Include a title and keep it engaging.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an English teaching assistant.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  });

  return {
    title: completion.choices[0].message.content?.split('\n')[0],
    text: completion.choices[0].message.content || '',
    level: params.level,
    category: params.category,
  };
}
```

#### Option B: Anthropic Claude

```typescript
// src/services/ai-service/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generatePracticeText(params: GenerateParams) {
  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate a ${params.level}-level English text about ${params.category}...`,
      },
    ],
  });

  return {
    text: response.content[0].text,
    level: params.level,
    category: params.category,
  };
}
```

#### Switch the Implementation

```typescript
// src/services/ai-service/index.ts
// Change this line to switch:
import { generatePracticeText } from './openai';
// import { generatePracticeText } from './anthropic';
// import { generatePracticeText } from './mocks'; // default
```

#### Environment Variables

```
# .env.local
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 2. Dictionary API Integration

### Current State

The vocabulary service (`src/services/vocabulary-service/dictionary.ts`) contains ~270 common English words with Spanish translations.

### Integration Options

#### Option A: Free Dictionary API

```typescript
// src/services/vocabulary-service/dictionary-api.ts
interface WordDefinition {
  word: string;
  partOfSpeech: string;
  translation: string;
  definition: string;
  example?: string;
}

export async function lookupWord(word: string): Promise<WordDefinition | null> {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const entry = data[0];
    
    return {
      word: entry.word,
      partOfSpeech: entry.meanings[0].partOfSpeech,
      translation: entry.meanings[0].definitions[0].definition,
      definition: entry.meanings[0].definitions[0].definition,
      example: entry.meanings[0].definitions[0].example,
    };
  } catch {
    return null;
  }
}
```

#### Option B: Custom API (e.g., Wordnik, Collins)

```typescript
// src/services/vocabulary-service/custom-api.ts
const API_KEY = process.env.DICTIONARY_API_KEY;

export async function lookupWord(word: string): Promise<WordDefinition | null> {
  const response = await fetch(
    `https://api.wordnik.com/v4/word/${word}/definitions?api_key=${API_KEY}`
  );
  
  if (!response.ok) return null;
  
  const data = await response.json();
  return {
    word: data.word,
    partOfSpeech: data.partOfSpeech,
    translation: data.text,
    definition: data.shortDefinition,
  };
}
```

#### Option C: Spanish Translation (DeepL, Google Translate)

```typescript
// src/services/vocabulary-service/translation-api.ts
import { translate } from '@deepai/sdk-translate';

export async function lookupWord(word: string): Promise<WordDefinition | null> {
  const translation = await translate({
    text: word,
    source: 'en',
    target: 'es',
  });
  
  return {
    word,
    partOfSpeech: 'unknown', // Would need POS tagging
    translation: translation.result,
    definition: translation.result,
  };
}
```

---

## 3. Cloud Sync & User Accounts

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client    │────▶│  API       │────▶│  Database  │
│  (Browser) │     │  (Next.js) │     │  (Supabase)│
└─────────────┘     └─────────────┘     └─────────────┘
```

### Recommended Stack

| Service | Purpose |
|---------|---------|
| **Next.js API Routes** | Backend API |
| **Supabase** | Database + Auth |
| **Clerk** | Authentication |

### Data Model (Supabase)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table (user's practice history)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  source TEXT NOT NULL,
  title TEXT,
  text_preview TEXT,
  wpm INTEGER,
  accuracy INTEGER,
  errors INTEGER,
  time_seconds INTEGER,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  text_size INTEGER DEFAULT 18,
  show_vocabulary BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT FALSE
);
```

### Sync Strategy

1. **Local First**: Keep localStorage as primary
2. **Background Sync**: Sync to cloud when online
3. **Conflict Resolution**: Last-write-wins with timestamps

---

## 4. OCR for Scanned PDFs

### Problem

Currently, only text-based PDFs work. Scanned documents return empty text.

### Solution: Tesseract.js

```typescript
// src/services/pdf-parser/ocr.ts
import Tesseract from 'tesseract.js';

export async function extractTextFromImage(
  imageData: ImageData
): Promise<string> {
  const result = await Tesseract.recognize(imageData, 'eng', {
    logger: m => console.log(m),
  });
  
  return result.data.text;
}

// Usage in pdf-parser/index.ts
async function processPage(page) {
  // Try text extraction first
  const text = await page.getTextContent();
  
  if (!text.trim()) {
    // Fall back to OCR
    const canvas = page.getViewport({ scale: 2 }).toCanvas();
    const imageData = canvas.getContext('2d').getImageData(0, 0, width, height);
    return extractTextFromImage(imageData);
  }
  
  return text;
}
```

---

## 5. File Format Support

### EPUB Support

```typescript
// src/services/epub-parser/index.ts
import epub from 'epub-parser';

export async function parseEpub(file: File): Promise<ParsedContent> {
  return new Promise((resolve, reject) => {
    epub.parse(file, (err, meta, items) => {
      if (err) reject(err);
      
      const sections = items
        .filter(item => item.type === 'chapter')
        .map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
        }));
      
      resolve({
        name: meta.title,
        sections,
      });
    });
  });
}
```

### Plain Text (.txt) Import

```typescript
// src/services/text-parser/index.ts
export async function parseText(file: File): Promise<ParsedContent> {
  const text = await file.text();
  
  return {
    name: file.name.replace('.txt', ''),
    sections: [
      {
        id: 'main',
        title: 'Main Text',
        content: text,
      },
    ],
  };
}
```

### Word Documents (.docx)

```typescript
// src/services/docx-parser/index.ts
import { extractRawText } from 'mammoth';

export async function parseDocx(file: File): Promise<ParsedContent> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await extractRawText({ arrayBuffer });
  
  return {
    name: file.name.replace('.docx', ''),
    sections: [
      {
        id: 'main',
        title: 'Main Document',
        content: result.value,
      },
    ],
  };
}
```

---

## Integration Priority

| Priority | Integration | Effort | Impact |
|----------|-------------|--------|--------|
| 1 | Real AI Service | Medium | High |
| 2 | Dictionary API | Low | Medium |
| 3 | Cloud Sync | High | High |
| 4 | OCR Support | Medium | Medium |
| 5 | EPUB Support | Low | Low |
| 6 | DOCX Support | Low | Low |

---

## Environment Setup

Create a `.env.local` file with any keys needed:

```bash
# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Dictionary
DICTIONARY_API_KEY=...

# Cloud (future)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_KEY=...
```

---

## Testing Integrations

Use feature flags to toggle between mock and real services:

```typescript
// src/services/feature-flags.ts
export const featureFlags = {
  useRealAI: process.env.NEXT_PUBLIC_USE_REAL_AI === 'true',
  useRealDictionary: process.env.NEXT_PUBLIC_USE_REAL_DICTIONARY === 'true',
  enableCloudSync: process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC === 'true',
};
```

Then in service files:

```typescript
import { featureFlags } from './feature-flags';
import { generatePracticeText as mockGenerate } from './mocks';
import { generatePracticeText as realGenerate } from './openai';

export const generatePracticeText = featureFlags.useRealAI
  ? realGenerate
  : mockGenerate;
```