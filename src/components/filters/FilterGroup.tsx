'use client';

import React, { useState } from 'react';
import { FilterGroupProps, FilterOption } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const filterColors = {
  'Program Type': ['#00ffd5', '#00ffaa'],
  'Region': ['#ff00ff', '#ff00aa'],
  'Institution Type': ['#ffff00', '#ffaa00'],
  'Language': ['#00ffff', '#00aaff']
} as const;

export function FilterGroup<T>({
  category,
  options,
  selectedValues,
  onChange,
  multiSelect = true
}: FilterGroupProps<T>) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredOption, setHoveredOption] = useState<T | null>(null);

  const handleChange = (value: T) => {
    if (multiSelect) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onChange(newValues);
    } else {
      onChange(selectedValues.includes(value) ? [] : [value]);
    }
  };

  const getOptionStyle = (value: T) => {
    const [color1, color2] = filterColors[category as keyof typeof filterColors] || ['#ffffff', '#ffffff'];
    const isSelected = selectedValues.includes(value);
    const isHovered = value === hoveredOption;

    return {
      background: isSelected
        ? `linear-gradient(135deg, ${color1}30 0%, ${color2}30 100%)`
        : isHovered
        ? `linear-gradient(135deg, ${color1}20 0%, ${color2}20 100%)`
        : 'transparent',
      boxShadow: isSelected
        ? `0 0 20px ${color1}20, inset 0 0 10px ${color2}20`
        : 'none',
      border: `1px solid ${isSelected ? color1 : 'transparent'}40`
    };
  };

  return (
    <motion.div 
      className="filter-group mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.button
        className="
          w-full flex items-center justify-between
          text-lg font-semibold mb-3 px-2
          text-white/90 hover:text-white
          transition-colors duration-300
        "
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>{category}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-white/70" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-hidden"
          >
            {options.map((option, index) => (
              <motion.div
                key={String(option.value)}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.label
                  className="
                    flex items-center space-x-3 px-3 py-2
                    rounded-lg cursor-pointer
                    text-white/80 hover:text-white
                    transition-all duration-300
                  "
                  style={getOptionStyle(option.value)}
                  onMouseEnter={() => setHoveredOption(option.value)}
                  onMouseLeave={() => setHoveredOption(null)}
                  whileHover={{ x: 4 }}
                >
                  <input
                    type={multiSelect ? "checkbox" : "radio"}
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleChange(option.value)}
                    className="
                      form-checkbox h-4 w-4
                      rounded border-white/20
                      text-white bg-white/10
                      focus:ring-offset-0 focus:ring-1 focus:ring-white/30
                      transition-all duration-300
                    "
                  />
                  <span className="flex-1">
                    {option.label}
                    {option.count !== undefined && (
                      <span className="ml-2 text-white/50">
                        ({option.count})
                      </span>
                    )}
                  </span>
                </motion.label>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}