/* eslint-disable no-console */
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useSchoolStore } from '@/stores/schoolStore';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Search, MapPin, GraduationCap, Building2, Users, CheckCircle, XCircle, Snowflake, Sun } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  type: 'university' | 'state' | 'program' | 'type' | 'nc' | 'semester';
  name: string;
  displayName: string;
  description?: string;
  action: () => void;
  icon: React.ReactNode;
  priority: number; // For sorting
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [search, setSearch] = useState('');
  
  const {
    processedUniversities,
    uniqueStates,
    uniqueProgramTypes,
    setActiveStateFilter,
    setActiveProgramFilter,
    setActiveTypeFilter,
    setActiveSemesterFilter,
    setActiveNcFilter,
    setSelectedUniversity,
    setSearchQuery,
    activeProgramFilter,
    activeStateFilter,
    activeTypeFilter,
    activeSemesterFilter,
    activeNcFilter,
  } = useSchoolStore();

  // Enhanced fuzzy search function with scoring
  const fuzzyMatch = (text: string, query: string): { matches: boolean; score: number } => {
    if (!query.trim()) return { matches: true, score: 0 };
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    
    // Exact match gets highest priority
    if (normalizedText === normalizedQuery) return { matches: true, score: 100 };
    if (normalizedText.includes(normalizedQuery)) return { matches: true, score: 80 };
    
    // Word-based fuzzy matching for better partial matches
    const textWords = normalizedText.split(/\s+/);
    const queryWords = normalizedQuery.split(/\s+/);
    
    // Check if all query words are found in text (order doesn't matter)
    let matchedWords = 0;
    let totalScore = 0;
    
    for (const queryWord of queryWords) {
      let bestWordScore = 0;
      for (const textWord of textWords) {
        if (textWord.includes(queryWord)) {
          // Full word contains query word - high score
          bestWordScore = Math.max(bestWordScore, 90);
        } else if (queryWord.includes(textWord)) {
          // Query word contains text word - medium score  
          bestWordScore = Math.max(bestWordScore, 70);
        } else {
          // Character-by-character fuzzy match as fallback
          let charMatchScore = 0;
          let queryIndex = 0;
          for (let i = 0; i < textWord.length && queryIndex < queryWord.length; i++) {
            if (textWord[i] === queryWord[queryIndex]) {
              queryIndex++;
              charMatchScore++;
            }
          }
          if (queryIndex === queryWord.length) {
            bestWordScore = Math.max(bestWordScore, (charMatchScore / queryWord.length) * 50);
          }
        }
      }
      
      if (bestWordScore > 0) {
        matchedWords++;
        totalScore += bestWordScore;
      }
    }
    
    // All query words must be matched
    const isMatch = matchedWords === queryWords.length;
    const finalScore = isMatch ? totalScore / queryWords.length : 0;
    return { matches: isMatch, score: finalScore };
  };

  // Levenshtein distance for typo-tolerant matching
  function levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = 1 + Math.min(
            matrix[i - 1][j],
            matrix[i][j - 1],
            matrix[i - 1][j - 1]
          );
        }
      }
    }
    return matrix[a.length][b.length];
  }

  // Generate unified search results
  const searchResults = useMemo((): SearchResult[] => {
    const results: SearchResult[] = [];

    if (search.trim()) {
      // Search universities (keep fuzzyMatch logic)
      processedUniversities.forEach(uni => {
        const nameMatch = fuzzyMatch(uni.name, search);
        const cityMatch = fuzzyMatch(uni.city || '', search);
        const descMatch = fuzzyMatch(uni.description || '', search);
        const programMatch = uni.programTypes.some(p => fuzzyMatch(p, search).matches);
        if (nameMatch.matches || cityMatch.matches || descMatch.matches || programMatch) {
          const maxScore = Math.max(nameMatch.score, cityMatch.score, descMatch.score);
          results.push({
            type: 'university',
            name: uni.name,
            displayName: uni.name,
            description: `${uni.city || ''}, ${uni.state}`,
            action: () => {
              setSelectedUniversity(uni);
              onClose();
            },
            icon: <GraduationCap className="h-4 w-4 text-blue-400" />,
            priority: maxScore + 10
          });
        }
      });

      // Search states (force substring match)
      uniqueStates.forEach(state => {
        const match = fuzzyMatch(state, search);
        const lev = levenshtein(state.toLowerCase(), search.toLowerCase());
        const isSubstring = state.toLowerCase().includes(search.toLowerCase());
        if (match.score > 0 || lev <= 2 || isSubstring) {
          const schoolCount = processedUniversities.filter(u => u.state === state).length;
          results.push({
            type: 'state',
            name: state,
            displayName: state,
            description: `${schoolCount} schools in this state`,
            action: () => {
              setActiveStateFilter(state);
              onClose();
            },
            icon: <MapPin className="h-4 w-4 text-cyan-400" />,
            priority: isSubstring ? 100 : Math.max(match.score, 30 - lev) + 8 // Force high priority if substring
          });
        }
      });

      // Search programs (force substring match)
      uniqueProgramTypes.forEach(program => {
        const match = fuzzyMatch(program, search);
        const lev = levenshtein(program.toLowerCase(), search.toLowerCase());
        const isSubstring = program.toLowerCase().includes(search.toLowerCase());
        if (match.score > 0 || lev <= 2 || isSubstring) {
          const schoolCount = processedUniversities.filter(u => u.programTypes.includes(program)).length;
          results.push({
            type: 'program',
            name: program,
            displayName: program,
            description: `${schoolCount} schools offer this program`,
            action: () => {
              setActiveProgramFilter(program);
              onClose();
            },
            icon: <Building2 className="h-4 w-4 text-emerald-400" />,
            priority: isSubstring ? 100 : Math.max(match.score, 30 - lev) + 6
          });
        }
      });

      // Search school types (force substring match)
      const uniqueTypes = Array.from(new Set(processedUniversities.map(u => u.type)));
      uniqueTypes.forEach(type => {
        const displayType = type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const match = fuzzyMatch(displayType, search);
        const lev = levenshtein(displayType.toLowerCase(), search.toLowerCase());
        const isSubstring = displayType.toLowerCase().includes(search.toLowerCase());
        if (match.score > 0 || lev <= 2 || isSubstring) {
          const schoolCount = processedUniversities.filter(u => u.type === type).length;
          results.push({
            type: 'type',
            name: type,
            displayName: displayType,
            description: `${schoolCount} schools of this type`,
            action: () => {
              setActiveTypeFilter(type);
              onClose();
            },
            icon: <Users className="h-4 w-4 text-purple-400" />,
            priority: isSubstring ? 100 : Math.max(match.score, 30 - lev) + 4
          });
        }
      });

      // Search NC-free options (force substring match)
      const ncTerms = ['NC-free', 'numerus clausus', 'nc'];
      const ncIsSubstring = ncTerms.some(term => term.toLowerCase().includes(search.toLowerCase()));
      if (ncTerms.some(term => fuzzyMatch(term, search).score > 0 || levenshtein(term.toLowerCase(), search.toLowerCase()) <= 2 || ncIsSubstring)) {
        results.push({
          type: 'nc',
          name: 'nc-yes',
          displayName: 'NC-free Schools',
          description: 'Show only schools without Numerus Clausus',
          action: () => {
            setActiveNcFilter(true);
            onClose();
          },
          icon: <CheckCircle className="h-4 w-4 text-green-400" />,
          priority: ncIsSubstring ? 100 : 50
        });
        results.push({
          type: 'nc',
          name: 'nc-no',
          displayName: 'Schools with NC',
          description: 'Show only schools with Numerus Clausus',
          action: () => {
            setActiveNcFilter(false);
            onClose();
          },
          icon: <XCircle className="h-4 w-4 text-red-400" />,
          priority: ncIsSubstring ? 99 : 49
        });
      }

      // Search semester options (force substring match)
      const semesterTerms = ['semester', 'winter', 'summer'];
      const semesterIsSubstring = semesterTerms.some(term => term.toLowerCase().includes(search.toLowerCase()));
      if (semesterTerms.some(term => fuzzyMatch(term, search).score > 0 || levenshtein(term.toLowerCase(), search.toLowerCase()) <= 2 || semesterIsSubstring)) {
        results.push({
          type: 'semester',
          name: 'winter',
          displayName: 'Winter Semester',
          description: 'Show schools accepting winter applications',
          action: () => {
            setActiveSemesterFilter('winter');
            onClose();
          },
          icon: <Snowflake className="h-4 w-4 text-blue-400" />,
          priority: semesterIsSubstring ? 100 : 48
        });
        results.push({
          type: 'semester',
          name: 'summer',
          displayName: 'Summer Semester',
          description: 'Show schools accepting summer applications',
          action: () => {
            setActiveSemesterFilter('summer');
            onClose();
          },
          icon: <Sun className="h-4 w-4 text-yellow-400" />,
          priority: semesterIsSubstring ? 99 : 47
        });
      }
    }

    // Sort by priority (highest first), then by type preference
    // TEMP DEBUG LOG
    if (typeof window !== 'undefined' && search.trim()) {
      // Only log in browser and when searching
      // console.log('SEARCH RESULTS:', results.map(r => ({type: r.type, name: r.name, displayName: r.displayName, priority: r.priority})));
    }
    return results.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      const typeOrder = { university: 0, state: 1, program: 2, type: 3, nc: 4, semester: 5 };
      return typeOrder[a.type] - typeOrder[b.type];
    }).slice(0, 25);
  }, [search, processedUniversities, uniqueStates, uniqueProgramTypes, setActiveStateFilter, setActiveProgramFilter, setActiveTypeFilter, setActiveSemesterFilter, setActiveNcFilter, setSelectedUniversity, onClose]);

  // Update search query in store
  useEffect(() => {
    setSearchQuery(search);
  }, [search, setSearchQuery]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSearchQuery('');
    }
  }, [isOpen, setSearchQuery]);

  // Group results by type for display
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    searchResults.forEach(result => {
      if (!groups[result.type]) groups[result.type] = [];
      groups[result.type].push(result);
    });
    return groups;
  }, [searchResults]);

  // Active filters display
  const activeFilters = useMemo(() => {
    const filters = [];
    if (activeStateFilter) filters.push({ type: 'State', value: activeStateFilter, clear: () => setActiveStateFilter(null) });
    if (activeProgramFilter) filters.push({ type: 'Program', value: activeProgramFilter, clear: () => setActiveProgramFilter(null) });
    if (activeTypeFilter) filters.push({ type: 'Type', value: activeTypeFilter.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), clear: () => setActiveTypeFilter(null) });
    if (activeSemesterFilter) filters.push({ type: 'Semester', value: activeSemesterFilter, clear: () => setActiveSemesterFilter(null) });
    if (activeNcFilter !== null) filters.push({ type: 'NC-free', value: activeNcFilter ? 'Yes' : 'No', clear: () => setActiveNcFilter(null) });
    return filters;
  }, [activeStateFilter, activeProgramFilter, activeTypeFilter, activeSemesterFilter, activeNcFilter, setActiveStateFilter, setActiveProgramFilter, setActiveTypeFilter, setActiveSemesterFilter, setActiveNcFilter]);

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <Command className="ui-organic min-h-[400px]">
        {/* Header with active filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-4 pb-2">
            <span className="text-xs text-cyan-300 font-medium">Active filters:</span>
            {activeFilters.map((filter, index) => (
              <span key={index} className="bg-cyan-700/80 text-white text-xs px-3 py-1.5 rounded-pill font-medium flex items-center gap-1 transition-all duration-300 hover:bg-cyan-600/90 hover:scale-105">
                {filter.type}: {filter.value}
                <button
                  className="ml-1 text-xs text-white/80 hover:text-white focus:outline-none"
                  onClick={filter.clear}
                  aria-label={`Clear ${filter.type} filter`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="flex items-center border-b border-white/10 px-4 bg-slate-800/30">
          <Search className="mr-3 h-4 w-4 shrink-0 text-cyan-400" />
          <CommandInput
            placeholder="Search or browse universities, programs, states, school types..."
            value={search}
            onValueChange={setSearch}
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Results */}
        <CommandList className="max-h-[450px] overflow-y-auto bg-slate-900/95 px-2">
          {search && searchResults.length === 0 && (
            <CommandEmpty className="text-slate-400 py-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-slate-500" />
                <p>No results found for "{search}"</p>
                <p className="text-xs text-slate-500">Try searching for universities, programs, states, or school types</p>
              </div>
            </CommandEmpty>
          )}
          
          {/* Universities */}
          {groupedResults.university && (
            <CommandGroup heading="Universities" className="text-cyan-300 text-sm font-semibold tracking-tight mb-2">
              {groupedResults.university.map(result => (
                <CommandItem
                  key={result.name}
                  onSelect={() => result.action()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    result.action();
                  }}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/60 hover:border hover:border-cyan-500/40 text-white rounded-soft mx-1 my-0.5 transition-all duration-300 hover:scale-[1.02]"
                >
                  {result.icon}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{result.displayName}</span>
                    {result.description && (
                      <span className="text-xs text-slate-400 truncate">{result.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Programs */}
          {groupedResults.program && (
            <CommandGroup heading="Programs" className="text-emerald-300 text-sm font-semibold tracking-tight mb-2">
              {groupedResults.program.map(result => (
                <CommandItem
                  key={result.name}
                  onSelect={() => result.action()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    result.action();
                  }}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/60 hover:border hover:border-emerald-500/40 text-white rounded-soft mx-1 my-0.5 transition-all duration-300 hover:scale-[1.02]"
                >
                  {result.icon}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{result.displayName}</span>
                    {result.description && (
                      <span className="text-xs text-slate-400 truncate">Filter by {result.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* States */}
          {groupedResults.state && (
            <CommandGroup heading="States" className="text-cyan-300 text-sm font-semibold tracking-tight mb-2">
              {groupedResults.state.map(result => (
                <CommandItem
                  key={result.name}
                  onSelect={() => result.action()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    result.action();
                  }}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/60 hover:border hover:border-cyan-500/40 text-white rounded-soft mx-1 my-0.5 transition-all duration-300 hover:scale-[1.02]"
                >
                  {result.icon}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{result.displayName}</span>
                    {result.description && (
                      <span className="text-xs text-slate-400 truncate">Filter by {result.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* School Types */}
          {groupedResults.type && (
            <CommandGroup heading="School Types" className="text-purple-300 text-sm font-semibold tracking-tight mb-2">
              {groupedResults.type.map(result => (
                <CommandItem
                  key={result.name}
                  onSelect={() => result.action()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    result.action();
                  }}
                  className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-700/60 hover:border hover:border-purple-500/40 text-white rounded-md mx-1 my-0.5 transition-all"
                >
                  {result.icon}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{result.displayName}</span>
                    {result.description && (
                      <span className="text-xs text-slate-400 truncate">Filter by {result.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* NC-free Options */}
          {groupedResults.nc && (
            <CommandGroup heading="NC-free Options" className="text-green-300 text-sm font-semibold tracking-tight mb-2">
              {groupedResults.nc.map(result => (
                <CommandItem
                  key={result.name}
                  onSelect={() => result.action()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    result.action();
                  }}
                  className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-700/60 hover:border hover:border-green-500/40 text-white rounded-md mx-1 my-0.5 transition-all"
                >
                  {result.icon}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{result.displayName}</span>
                    {result.description && (
                      <span className="text-xs text-slate-400 truncate">{result.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Semester Options */}
          {groupedResults.semester && (
            <CommandGroup heading="Semester Options" className="text-yellow-300 text-sm font-semibold tracking-tight mb-2">
              {groupedResults.semester.map(result => (
                <CommandItem
                  key={result.name}
                  onSelect={() => result.action()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    result.action();
                  }}
                  className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-700/60 hover:border hover:border-yellow-500/40 text-white rounded-md mx-1 my-0.5 transition-all"
                >
                  {result.icon}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{result.displayName}</span>
                    {result.description && (
                      <span className="text-xs text-slate-400 truncate">{result.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Instructions when no search */}
          {!search && (
            <div className="px-6 py-8 text-center">
              <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Search Schools</h3>
              <p className="text-sm text-slate-400 mb-6">Find universities, programs, states, or school types</p>
              
              <div className="max-w-sm mx-auto space-y-3 text-left">
                <div className="flex items-center gap-3 text-xs">
                  <GraduationCap className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-slate-300">Universities:</span>
                  <span className="text-slate-400">"Bremen Academy" • "UdK Berlin"</span>
                </div>
                
                <div className="flex items-center gap-3 text-xs">
                  <MapPin className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-300">States:</span>
                  <span className="text-slate-400">"Bremen" • "Bavaria" • "Berlin"</span>
                </div>
                
                <div className="flex items-center gap-3 text-xs">
                  <Building2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-300">Programs:</span>
                  <span className="text-slate-400">"Fine Arts" • "Design" • "Architecture"</span>
                </div>
                
                <div className="flex items-center gap-3 text-xs">
                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">Options:</span>
                  <span className="text-slate-400">"NC-free" • "Winter" • "University"</span>
                </div>
              </div>
              
              <div className="text-xs text-slate-500 mt-6">
                <p>↑↓ navigate • Enter select • Esc close</p>
              </div>
            </div>
          )}

          {/* Clear all filters option */}
          {activeFilters.length > 0 && !search && (
            <CommandGroup heading="Quick Actions" className="text-slate-400 text-sm font-semibold tracking-tight mb-2">
              <CommandItem
                onSelect={() => {
                  setActiveStateFilter(null);
                  setActiveProgramFilter(null);
                  setActiveTypeFilter(null);
                  setActiveSemesterFilter(null);
                  setActiveNcFilter(null);
                  setSelectedUniversity(null);
                  onClose();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setActiveStateFilter(null);
                  setActiveProgramFilter(null);
                  setActiveTypeFilter(null);
                  setActiveSemesterFilter(null);
                  setActiveNcFilter(null);
                  setSelectedUniversity(null);
                  onClose();
                }}
                className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-700/60 hover:border hover:border-slate-500/40 text-white rounded-md mx-1 my-0.5 transition-all"
              >
                <Search className="h-4 w-4" />
                <span>Clear all filters</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
} 