'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FilterGroup } from './FilterGroup';
import {
  FilterState,
  FilterOption,
  ProgramType,
  Region,
  InstitutionType,
  Language,
  FilterSystemProps
} from './types';
import debounce from 'lodash/debounce';

const INITIAL_FILTER_STATE: FilterState = {
  programTypes: [],
  regions: [],
  institutionTypes: [],
  language: null
};

const PROGRAM_TYPE_OPTIONS: FilterOption<ProgramType>[] = [
  { value: 'Design', label: 'Design' },
  { value: 'Design & Architecture', label: 'Design & Architecture' },
  { value: 'Art & Design', label: 'Art & Design' },
  { value: 'Fine Arts', label: 'Fine Arts' },
  { value: 'Media Arts', label: 'Media Arts' },
  { value: 'Design & Media', label: 'Design & Media' },
  { value: 'Graphic Design', label: 'Graphic Design' },
  { value: 'Multidisciplinary Arts', label: 'Multidisciplinary Arts' },
  { value: 'Art Therapy', label: 'Art Therapy' },
  { value: 'Contemporary Art', label: 'Contemporary Art' },
  { value: 'Visual Arts', label: 'Visual Arts' },
  { value: 'Technology & Media', label: 'Technology & Media' },
  { value: 'Technology & Sciences', label: 'Technology & Sciences' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Design & Engineering', label: 'Design & Engineering' },
  { value: 'Humanities', label: 'Humanities' },
  { value: 'Engineering & Social Sciences', label: 'Engineering & Social Sciences' },
  { value: 'Technology & Automotive', label: 'Technology & Automotive' },
  { value: 'Social & Health Sciences', label: 'Social & Health Sciences' },
  { value: 'Liberal Arts', label: 'Liberal Arts' },
  { value: 'Performing Arts', label: 'Performing Arts' },
  { value: 'Arts & Social Sciences', label: 'Arts & Social Sciences' },
  { value: 'Engineering & Technology', label: 'Engineering & Technology' },
  { value: 'Fine Arts & Conservation', label: 'Fine Arts & Conservation' }
];

const REGION_OPTIONS: FilterOption<Region>[] = [
  { value: 'Baden-Württemberg', label: 'Baden-Württemberg' },
  { value: 'Bavaria', label: 'Bavaria' },
  { value: 'Berlin', label: 'Berlin' },
  { value: 'Brandenburg', label: 'Brandenburg' },
  { value: 'Bremen', label: 'Bremen' },
  { value: 'Hamburg', label: 'Hamburg' },
  { value: 'Hesse', label: 'Hesse' },
  { value: 'Lower Saxony', label: 'Lower Saxony' },
  { value: 'North Rhine-Westphalia', label: 'North Rhine-Westphalia' },
  { value: 'Rhineland-Palatinate', label: 'Rhineland-Palatinate' },
  { value: 'Saxony', label: 'Saxony' },
  { value: 'Saxony-Anhalt', label: 'Saxony-Anhalt' },
  { value: 'Saarland', label: 'Saarland' },
  { value: 'Schleswig-Holstein', label: 'Schleswig-Holstein' },
  { value: 'Thuringia', label: 'Thuringia' }
];

const INSTITUTION_TYPE_OPTIONS: FilterOption<InstitutionType>[] = [
  { value: 'University', label: 'University' },
  { value: 'University of Applied Sciences', label: 'University of Applied Sciences' },
  { value: 'Art Academy', label: 'Art Academy' },
  { value: 'Private Institution', label: 'Private Institution' },
  { value: 'Kunsthochschule', label: 'Art School' }
];

const LANGUAGE_OPTIONS: FilterOption<Language>[] = [
  { value: 'German Only', label: 'German Only' },
  { value: 'English Only', label: 'English Only' },
  { value: 'German & English', label: 'German & English' },
  { value: 'English & German', label: 'English & German' },
  { value: 'Bilingual', label: 'Bilingual' }
];

export function FilterSystem({ nodes, onFilterChange }: FilterSystemProps) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

  const applyFilters = useCallback((nodes: any[], filters: FilterState) => {
    return nodes.filter(node => {
      const matchesProgramType = filters.programTypes.length === 0 || 
        filters.programTypes.includes(node.programType);
      
      const matchesRegion = filters.regions.length === 0 || 
        filters.regions.includes(node.region);
      
      const matchesInstitutionType = filters.institutionTypes.length === 0 || 
        filters.institutionTypes.includes(node.institutionType);
      
      const matchesLanguage = !filters.language || 
        node.language === filters.language;

      return matchesProgramType && matchesRegion && 
             matchesInstitutionType && matchesLanguage;
    });
  }, []);

  const debouncedFilterChange = useMemo(
    () => debounce((filteredNodes: any[]) => {
      onFilterChange(filteredNodes);
    }, 150),
    [onFilterChange]
  );

  useEffect(() => {
    const filteredNodes = applyFilters(nodes, filters);
    debouncedFilterChange(filteredNodes);
    return () => {
      debouncedFilterChange.cancel();
    };
  }, [nodes, filters, applyFilters, debouncedFilterChange]);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="filter-system p-4 space-y-6">
      <FilterGroup
        category="Program Type"
        options={PROGRAM_TYPE_OPTIONS}
        selectedValues={filters.programTypes}
        onChange={values => updateFilter('programTypes', values)}
        multiSelect={true}
      />
      
      <FilterGroup
        category="Region"
        options={REGION_OPTIONS}
        selectedValues={filters.regions}
        onChange={values => updateFilter('regions', values)}
        multiSelect={true}
      />
      
      <FilterGroup
        category="Institution Type"
        options={INSTITUTION_TYPE_OPTIONS}
        selectedValues={filters.institutionTypes}
        onChange={values => updateFilter('institutionTypes', values)}
        multiSelect={true}
      />
      
      <FilterGroup
        category="Language"
        options={LANGUAGE_OPTIONS}
        selectedValues={filters.language ? [filters.language] : []}
        onChange={values => updateFilter('language', values[0] || null)}
        multiSelect={false}
      />
    </div>
  );
} 