'use client';

import { cn } from '@/utils/cn';
import { formatTime } from '@/utils/metrics';
import { Clock, Target, Zap, AlertCircle } from 'lucide-react';

interface MetricsBarProps {
  wpm: number;
  accuracy: number;
  errors: number;
  time: number;
  progress: number;
  status: 'idle' | 'active' | 'completed';
}

export function MetricsBar({ wpm, accuracy, errors, time, progress, status }: MetricsBarProps) {
  const isActive = status === 'active';
  const isCompleted = status === 'completed';
  
  return (
    <div className={cn(
      'flex items-center justify-center gap-6 py-4',
      'transition-opacity duration-300',
      status === 'idle' ? 'opacity-60' : 'opacity-100'
    )}>
      {/* WPM */}
      <div className="flex items-center gap-2">
        <Zap className={cn('w-4 h-4', isActive ? 'text-blue-400' : 'text-zinc-500')} />
        <div className="flex flex-col">
          <span className={cn(
            'text-lg font-mono font-semibold tabular-nums',
            isActive ? 'text-zinc-100' : 'text-zinc-400'
          )}>
            {wpm}
          </span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">WPM</span>
        </div>
      </div>
      
      {/* Divider */}
      <div className="w-px h-8 bg-zinc-800" />
      
      {/* Accuracy */}
      <div className="flex items-center gap-2">
        <Target className={cn('w-4 h-4', isActive ? 'text-emerald-400' : 'text-zinc-500')} />
        <div className="flex flex-col">
          <span className={cn(
            'text-lg font-mono font-semibold tabular-nums',
            accuracy >= 95 ? 'text-emerald-400' : accuracy >= 80 ? 'text-yellow-400' : 'text-red-400'
          )}>
            {accuracy}%
          </span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Accuracy</span>
        </div>
      </div>
      
      {/* Divider */}
      <div className="w-px h-8 bg-zinc-800" />
      
      {/* Errors */}
      <div className="flex items-center gap-2">
        <AlertCircle className={cn(
          'w-4 h-4',
          errors > 0 ? 'text-red-400' : 'text-zinc-500'
        )} />
        <div className="flex flex-col">
          <span className={cn(
            'text-lg font-mono font-semibold tabular-nums',
            errors > 0 ? 'text-red-400' : 'text-zinc-400'
          )}>
            {errors}
          </span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Errors</span>
        </div>
      </div>
      
      {/* Divider */}
      <div className="w-px h-8 bg-zinc-800" />
      
      {/* Time */}
      <div className="flex items-center gap-2">
        <Clock className={cn('w-4 h-4', isActive ? 'text-zinc-300' : 'text-zinc-500')} />
        <div className="flex flex-col">
          <span className={cn(
            'text-lg font-mono font-semibold tabular-nums',
            isActive ? 'text-zinc-100' : 'text-zinc-400'
          )}>
            {formatTime(time)}
          </span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Time</span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="hidden md:flex items-center gap-3 ml-4">
        <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isCompleted ? 'bg-emerald-400' : isActive ? 'bg-blue-500' : 'bg-zinc-700'
            )}
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500 tabular-nums">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}