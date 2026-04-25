'use client';

import { MAX_VERB_COUNT, MIN_VERB_COUNT, verbPracticeTracks } from '@/config/verb-practice/fallbackBank';
import { verbPracticeTypes } from '@/features/verb-practice/helpers';
import { VerbPracticeTrack, VerbPracticeType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const trackLabels: Record<VerbPracticeTrack, string> = {
  A1: 'A1 - Beginner',
  A2: 'A2 - Elementary',
  B1: 'B1 - Intermediate',
  B2: 'B2 - Upper Intermediate',
  C1: 'C1 - Advanced',
  'technical-engineering': 'Technical Engineering',
};

const practiceTypeLabels: Record<VerbPracticeType, string> = {
  base: 'Base verbs',
  pastSimple: 'Past simple',
  pastParticiple: 'Past participle',
  gerund: 'Gerund',
  thirdPerson: 'Third person',
  mixed: 'Mixed forms',
};

interface VerbPracticeControlsProps {
  count: number;
  track: VerbPracticeTrack;
  practiceType: VerbPracticeType;
  isGenerating: boolean;
  message?: string;
  onCountChange: (count: number) => void;
  onTrackChange: (track: VerbPracticeTrack) => void;
  onPracticeTypeChange: (practiceType: VerbPracticeType) => void;
  onGenerate: () => void;
}

export function VerbPracticeControls({
  count,
  track,
  practiceType,
  isGenerating,
  message,
  onCountChange,
  onTrackChange,
  onPracticeTypeChange,
  onGenerate,
}: VerbPracticeControlsProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
        <Input
          id="verb-count"
          label="Quantity"
          type="number"
          min={MIN_VERB_COUNT}
          max={MAX_VERB_COUNT}
          value={count}
          onChange={event => onCountChange(Number(event.target.value))}
        />
        <Select
          id="verb-track"
          label="Level or track"
          value={track}
          onChange={event => onTrackChange(event.target.value as VerbPracticeTrack)}
          options={verbPracticeTracks.map(value => ({ value, label: trackLabels[value] }))}
        />
        <Select
          id="verb-practice-type"
          label="Practice type"
          value={practiceType}
          onChange={event => onPracticeTypeChange(event.target.value as VerbPracticeType)}
          options={verbPracticeTypes.map(value => ({ value, label: practiceTypeLabels[value] }))}
        />
        <Button onClick={onGenerate} disabled={isGenerating} className="w-full md:w-auto">
          {isGenerating ? 'Generating...' : 'Generate Session'}
        </Button>
      </div>
      <p className="mt-3 text-sm text-zinc-500">
        Choose {MIN_VERB_COUNT}-{MAX_VERB_COUNT} items. Technical Engineering is separate from CEFR levels.
      </p>
      {message && <p className="mt-2 text-sm text-amber-300">{message}</p>}
    </div>
  );
}
