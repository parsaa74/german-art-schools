'use client'

import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

interface SearchButtonProps {
  onClick: () => void;
  className?: string;
}

export function SearchButton({ 
  onClick, 
  className = ''
}: SearchButtonProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect if user is on Mac to show appropriate shortcut
    // eslint-disable-next-line no-undef
    if (typeof window !== 'undefined' && navigator) {
      // eslint-disable-next-line no-undef
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    }
  }, []);

  const shortcutKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="relative group">
      {/* Enhanced background glow with multiple layers */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 rounded-organic blur-sm opacity-30 group-hover:opacity-60 animate-pulse transition duration-500"></div>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 via-blue-400/50 to-cyan-500/50 rounded-organic blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
      
      <button
        onClick={onClick}
        className={`
          relative ui-organic
          flex items-center justify-between gap-4 
          px-8 py-4 min-w-[280px] h-14
          text-white font-medium text-base
          hover:scale-[1.02] active:scale-[0.98]
          transition-all duration-300 ease-out
          group cursor-pointer
          ${className}
        `}
        aria-label="Open search (Cmd+K or Ctrl+K)"
      >
        {/* Left side: Icon and text */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="h-5 w-5 text-blue-300 group-hover:text-cyan-300 transition-colors duration-200 relative z-10" />
            {/* Icon glow effect */}
            <div className="absolute inset-0 h-5 w-5 bg-blue-400 group-hover:bg-cyan-400 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-all duration-200"></div>
          </div>
          <span className="text-white/90 group-hover:text-white transition-colors duration-200 font-medium tracking-wide">
            Search Schools
          </span>
        </div>
        
        {/* Right side: Keyboard shortcut indicator */}
        <div className="flex items-center gap-2 text-xs text-white/60 group-hover:text-white/80 transition-colors duration-200">
          <kbd className="
            px-3 py-2 
            bg-white/10 group-hover:bg-white/20
            border border-white/20 group-hover:border-white/30
            rounded-soft text-xs font-mono font-medium
            min-w-[32px] text-center
            shadow-sm group-hover:shadow-md
            transition-all duration-200
            backdrop-blur-sm
          ">
            {shortcutKey}
          </kbd>
          <span className="text-white/40 group-hover:text-white/60 transition-colors duration-200">+</span>
          <kbd className="
            px-3 py-2 
            bg-white/10 group-hover:bg-white/20
            border border-white/20 group-hover:border-white/30
            rounded-soft text-xs font-mono font-medium
            min-w-[32px] text-center
            shadow-sm group-hover:shadow-md
            transition-all duration-200
            backdrop-blur-sm
          ">
            K
          </kbd>
        </div>

        {/* Subtle inner highlight */}
        <div className="absolute inset-[1px] rounded-organic bg-gradient-to-b from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
    </div>
  );
}
