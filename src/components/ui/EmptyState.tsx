'use client';

import { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { FileText, Sparkles, History, BookOpen, Settings, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'file' | 'ai' | 'history' | 'vocabulary' | 'settings' | 'folder' | 'default';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const iconMap = {
  file: FileText,
  ai: Sparkles,
  history: History,
  vocabulary: BookOpen,
  settings: Settings,
  folder: FolderOpen,
  default: FileText,
};

export function EmptyState({ 
  icon = 'default', 
  title, 
  description, 
  action, 
  secondaryAction,
  className 
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center py-16 px-8',
      'animate-in fade-in duration-300',
      className
    )}>
      <div className={cn(
        'w-16 h-16 rounded-2xl flex items-center justify-center mb-6',
        'bg-zinc-900 border border-zinc-800',
        'transition-transform duration-200 hover:scale-105'
      )}>
        <Icon className="w-8 h-8 text-zinc-500" strokeWidth={1.5} />
      </div>
      
      <h3 className="text-lg font-medium text-zinc-100 mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-zinc-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="secondary" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
