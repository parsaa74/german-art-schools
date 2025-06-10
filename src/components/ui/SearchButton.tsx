'use client'

import React from 'react';
import { Search, Command } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchButtonProps {
  onClick: () => void;
}

export function SearchButton({ onClick }: SearchButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="group relative flex items-center gap-2 px-6 py-3 ui-organic text-slate-300 hover:text-white transition-all duration-300 min-w-[240px]"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98, y: 0 }}
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 18 }}
    >
      {/* Search Icon */}
      <Search className="h-4 w-4 text-cyan-400" />
      
      {/* Search Text */}
      <span className="text-sm font-medium text-left flex-1">
        Search schools, states...
      </span>
      
      {/* Keyboard Shortcut Indicator */}
      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-0.5">
          <kbd className="px-2 py-1 text-xs font-semibold text-slate-300 bg-white/10 border border-white/20 rounded-soft shadow-inner-glow">
            <Command className="h-2.5 w-2.5 inline mr-0.5" />
            K
          </kbd>
        </div>
      </div>
      
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-organic bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.button>
  );
} 