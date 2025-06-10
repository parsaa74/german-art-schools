'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command } from 'lucide-react';

export function SearchTooltip() {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show tooltip after a delay when component mounts
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2000);

    // Hide tooltip after 4 seconds
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg shadow-lg border border-white/20 backdrop-blur-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4" />
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">
                <Command className="h-2.5 w-2.5 inline mr-0.5" />
                K
              </kbd>
              <span>to search</span>
            </div>
            {/* Arrow pointing up */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-blue-600"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 