'use client';

import Link from 'next/link';
import { Keyboard, History, Settings, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

interface HeaderProps {
  currentPage?: string;
}

export function Header({ currentPage }: HeaderProps) {
  const navItems = [
    { href: '/home', label: 'Home', icon: Home, id: 'home' },
    { href: '/history', label: 'History', icon: History, id: 'history' },
    { href: '/settings', label: 'Settings', icon: Settings, id: 'settings' },
  ];
  
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2 text-zinc-100 hover:text-white transition-colors">
          <Keyboard className="w-5 h-5" />
          <span className="font-semibold text-lg">TypeLearn</span>
        </Link>
        
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                'transition-all duration-200',
                currentPage === item.id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}