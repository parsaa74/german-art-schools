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
      className="group relative flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 backdrop-blur-lg text-slate-300 border border-white/20 shadow-lg hover:text-white hover:bg-slate-800/90 transition-all duration-200 rounded-lg min-w-[200px]"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
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
          <kbd className="px-1.5 py-0.5 text-xs font-semibold text-slate-400 bg-slate-700/80 border border-slate-600/50 rounded shadow-sm">
            <Command className="h-2.5 w-2.5 inline mr-0.5" />
            K
          </kbd>
        </div>
      </div>
      
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.button>
  );
} 