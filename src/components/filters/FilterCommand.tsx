import { useState, useEffect, useRef } from 'react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import type { University } from '../map/UniversityNodes';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterCommandProps {
  universities: University[];
  onFilterChange: (filtered: University[]) => void;
  activeFilters: {
    programTypes: string[];
    regions: string[];
    institutionTypes: string[];
    language: string | null;
  };
  setActiveFilters: React.Dispatch<React.SetStateAction<{
    programTypes: string[];
    regions: string[];
    institutionTypes: string[];
    language: string | null;
  }>>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

type FilterCategory = 'programTypes' | 'regions' | 'institutionTypes' | 'language';

const FILTER_COLORS = {
  programTypes: ['#00ffd5', '#00ffaa'],
  regions: ['#ff00ff', '#ff00aa'],
  institutionTypes: ['#ffff00', '#ffaa00'],
  language: ['#00ffff', '#00aaff']
} as const;

function getUniqueValues<T>(array: T[]): T[] {
  return array.filter((value, index, self) => self.indexOf(value) === index);
}

export function FilterCommand({ 
  universities, 
  onFilterChange, 
  activeFilters, 
  setActiveFilters,
  isOpen,
  setIsOpen 
}: FilterCommandProps) {
  const [search, setSearch] = useState("");
  const [hoveredCategory, setHoveredCategory] = useState<FilterCategory | null>(null);
  const commandRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Reset search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  // Close command palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  // Get unique values for each filter category
  const uniqueValues = {
    programTypes: getUniqueValues(universities.map(u => u.programType)),
    regions: getUniqueValues(universities.map(u => u.region)),
    institutionTypes: getUniqueValues(universities.map(u => u.type)),
    language: getUniqueValues(universities.map(u => u.language))
  };

  // Filter values based on search
  const filterValues = (values: string[]) => {
    if (!search) return values;
    return values.filter(value => 
      value.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleSelect = (category: FilterCategory, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      if (category === 'language') {
        newFilters.language = prev.language === value ? null : value;
      } else {
        if (prev[category].includes(value)) {
          newFilters[category] = prev[category].filter(v => v !== value);
        } else {
          newFilters[category] = [...prev[category], value];
        }
      }

      // Apply filters
      const filtered = universities.filter(uni => {
        const matchesProgramType = newFilters.programTypes.length === 0 || 
          newFilters.programTypes.includes(uni.programType);
        
        const matchesRegion = newFilters.regions.length === 0 || 
          newFilters.regions.includes(uni.region);
        
        const matchesInstitutionType = newFilters.institutionTypes.length === 0 || 
          newFilters.institutionTypes.includes(uni.type);
        
        const matchesLanguage = !newFilters.language || 
          uni.language === newFilters.language;

        return matchesProgramType && matchesRegion && 
               matchesInstitutionType && matchesLanguage;
      });

      onFilterChange(filtered);
      return newFilters;
    });
  };

  const getGradientStyle = (category: FilterCategory) => {
    const [color1, color2] = FILTER_COLORS[category];
    const isHovered = hoveredCategory === category;
    const hasActiveFilters = category === 'language' 
      ? activeFilters[category] !== null 
      : activeFilters[category].length > 0;

    return {
      background: `linear-gradient(135deg, ${color1}${isHovered ? '40' : '20'} 0%, ${color2}${isHovered ? '40' : '20'} 100%)`,
      boxShadow: hasActiveFilters 
        ? `0 0 20px ${color1}40, inset 0 0 20px ${color2}40` 
        : 'none',
      transition: 'all 0.3s ease-out'
    };
  };

  return (
    <motion.div 
      ref={commandRef}
      className="relative w-[32rem] max-w-[90vw]"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div 
        className={`
          absolute inset-0 -z-10 
          rounded-xl overflow-hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        <div 
          className="
            absolute inset-0 
            bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1),_transparent_50%)]
          "
        />
      </div>

      <Command 
        className={`
          rounded-xl border border-white/10
          bg-transparent backdrop-blur-xl
          transition-all duration-300
          ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
        `}
      >
        <motion.div 
          className="flex items-center border-b border-white/10 px-3 h-14"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="w-5 h-5 text-white/50" />
          <CommandInput 
            placeholder="Search filters..." 
            value={search}
            onValueChange={setSearch}
            onFocus={() => setIsOpen(true)}
            className="
              flex-1 bg-transparent border-none 
              text-white/90 placeholder:text-white/50
              focus:outline-none focus:ring-0
              h-12 px-3
            "
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => setSearch("")}
                className="text-white/50 hover:text-white/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {isOpen && (
          <CommandList className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <CommandEmpty>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/50 text-center py-8"
              >
                No filters found.
              </motion.div>
            </CommandEmpty>
            
            {(['programTypes', 'regions', 'institutionTypes', 'language'] as const).map((category, index) => (
              <CommandGroup 
                key={category}
                heading={category.replace(/([A-Z])/g, ' $1').trim()}
                className="px-2 relative"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {filterValues(uniqueValues[category]).map((value, valueIndex) => (
                    <CommandItem
                      key={value}
                      onSelect={() => handleSelect(category, value)}
                      onMouseEnter={() => {
                        clearTimeout(timeoutRef.current);
                        setHoveredCategory(category);
                      }}
                      onMouseLeave={() => {
                        timeoutRef.current = setTimeout(() => {
                          setHoveredCategory(null);
                        }, 300);
                      }}
                      className="
                        flex items-center justify-between
                        rounded-lg px-3 py-2.5 my-1
                        text-white/80 hover:text-white
                        cursor-pointer
                        transition-all duration-300
                      "
                      style={getGradientStyle(category)}
                    >
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: valueIndex * 0.05 }}
                      >
                        {value}
                      </motion.span>
                      <AnimatePresence>
                        {((category === 'language' && activeFilters[category] === value) ||
                          (category !== 'language' && activeFilters[category].includes(value))) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Badge 
                              className={`
                                backdrop-blur-sm flex items-center gap-1 pr-1
                                bg-white/10 text-white/90
                                border border-white/20
                              `}
                            >
                              Selected
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CommandItem>
                  ))}
                </motion.div>
              </CommandGroup>
            ))}
          </CommandList>
        )}
      </Command>
    </motion.div>
  );
} 