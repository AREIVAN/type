'use client';

import { useState } from 'react';
import { FileText, ChevronRight, Check, Search, Loader2, FolderOpen } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

interface Section {
  id: string;
  title: string;
  content: string;
  pageNumber?: number;
}

interface SectionSelectorProps {
  sections: Section[];
  pdfName: string;
  onSelect: (section: Section) => void;
  isLoading?: boolean;
}

export function SectionSelector({ sections, pdfName, onSelect, isLoading }: SectionSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewSection, setPreviewSection] = useState<Section | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (section: Section) => {
    setSelectedId(section.id);
    setPreviewSection(section);
  };

  const handleStart = () => {
    if (previewSection) {
      onSelect(previewSection);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">{pdfName}</h2>
          <p className="text-sm text-zinc-500">{sections.length} sections available</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sections List */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSelect(section)}
                className={cn(
                  'w-full p-4 flex items-center justify-between gap-3',
                  'border-b border-zinc-800/50 last:border-0',
                  'hover:bg-zinc-800/50 transition-colors',
                  selectedId === section.id && 'bg-blue-500/10'
                )}
              >
                <div className="flex-1 text-left">
                  <p className={cn(
                    'font-medium truncate',
                    selectedId === section.id ? 'text-blue-400' : 'text-zinc-300'
                  )}>
                    {section.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {section.content.length} characters
                    {section.pageNumber && ` • Page ${section.pageNumber}`}
                  </p>
                </div>
                {selectedId === section.id && (
                  <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                )}
              </button>
            ))}
            
            {filteredSections.length === 0 && (
              <EmptyState
                icon="folder"
                title="No sections found"
                description={searchQuery ? "Try adjusting your search query" : "This PDF doesn't contain extractable text sections"}
              />
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="font-medium text-zinc-300">Preview</h3>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {previewSection ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-zinc-400 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {previewSection.content.length > 500 
                    ? previewSection.content.slice(0, 500) + '...'
                    : previewSection.content}
                </p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-zinc-500 text-sm">
                  Select a section to preview
                </p>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="p-4 border-t border-zinc-800">
            <Button
              onClick={handleStart}
              disabled={!selectedId || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Start Practice
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}