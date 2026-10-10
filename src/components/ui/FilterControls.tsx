'use client'

/**
 * FilterControls — the "All filters" panel body: the matching schools on top,
 * then every filter as a grouped select showing how many schools each option
 * leaves (options that would leave none are disabled).
 */

import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { X } from 'lucide-react';
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore';
import { Filters, filtersFromState, passesFilters, optionCounts, matchingPrograms } from '@/lib/glass/filter';
import { SUBJECT_GROUPS, DEGREE_GROUPS, LANGUAGES, SCHOOL_TYPES, typeLabel, typeColor } from '@/lib/taxonomy';

export const SEMESTER_LABELS: Record<string, string> = { winter: 'Winter semester intake', summer: 'Summer semester intake' };
export const LANGUAGE_LABELS: Record<string, string> = { German: 'Taught in German', English: 'Taught in English (incl. bilingual)' };
export const METHOD_LABELS: Record<string, string> = {
  direct: 'Direct to the school — no uni-assist fee',
  'uni-assist': 'Via uni-assist (€75 first, €30 each extra)',
};

export function useFilterStore() {
  return useSchoolStore((st) => ({
    processedUniversities: st.processedUniversities,
    uniqueStates: st.uniqueStates,
    searchQuery: st.searchQuery,
    activeStateFilter: st.activeStateFilter,
    activeProgramFilter: st.activeProgramFilter,
    activeTypeFilter: st.activeTypeFilter,
    activeSemesterFilter: st.activeSemesterFilter,
    activeNcFilter: st.activeNcFilter,
    activeApplicationMethodFilter: st.activeApplicationMethodFilter,
    activeCourseLanguageFilter: st.activeCourseLanguageFilter,
    activeDegreeFilter: st.activeDegreeFilter,
    timelineFilter: st.timelineFilter,
    setActiveStateFilter: st.setActiveStateFilter,
    setActiveProgramFilter: st.setActiveProgramFilter,
    setActiveTypeFilter: st.setActiveTypeFilter,
    setActiveSemesterFilter: st.setActiveSemesterFilter,
    setActiveNcFilter: st.setActiveNcFilter,
    setActiveApplicationMethodFilter: st.setActiveApplicationMethodFilter,
    setActiveCourseLanguageFilter: st.setActiveCourseLanguageFilter,
    setActiveDegreeFilter: st.setActiveDegreeFilter,
    setSearchQuery: st.setSearchQuery,
  }), shallow);
}

export function clearAllFilters() {
  const st = useSchoolStore.getState();
  st.setActiveStateFilter(null);
  st.setActiveProgramFilter(null);
  st.setActiveTypeFilter(null);
  st.setActiveSemesterFilter(null);
  st.setActiveNcFilter(null);
  st.setActiveApplicationMethodFilter(null);
  st.setActiveCourseLanguageFilter(null);
  st.setActiveDegreeFilter(null);
  st.setSearchQuery('');
}

/** Clickable list of the schools that pass the filters, with their matching program count. */
export function ResultList({ schools, filters, max = 'max-h-48' }: { schools: ProcessedUniversity[]; filters: Filters; max?: string }) {
  const setSelectedUniversity = useSchoolStore((s) => s.setSelectedUniversity);
  const programFiltered = !!(filters.program || filters.degree || filters.language || filters.semester || filters.nc);
  return (
    <ul className={`${max} overflow-y-auto pr-1 space-y-0.5`}>
      {schools.map((u) => {
        const n = programFiltered ? matchingPrograms(u, filters).length : u.programCount;
        return (
          <li key={u.id}>
            <button
              onClick={() => setSelectedUniversity(u)}
              className="w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-soft hover:bg-white/10 focus-visible:bg-white/10 transition-colors"
            >
              <span className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0" style={{ background: typeColor(u.type) }} aria-hidden />
              <span className="flex-1 min-w-0">
                <span className="block text-xs text-slate-100 leading-snug">{u.name}</span>
                <span className="block text-[0.65rem] text-slate-400">
                  {u.city} · {n} {programFiltered ? 'matching ' : ''}program{n === 1 ? '' : 's'}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface SelectProps<T extends string> {
  id: string;
  label: string;
  value: T | null;
  anyLabel: string;
  options: Array<{ value: T; label: string }>;
  counts: Map<any, number>;
  onChange: (v: T | null) => void;
  note?: React.ReactNode;
}

function FilterSelect<T extends string>({ id, label, value, anyLabel, options, counts, onChange, note }: SelectProps<T>) {
  return (
    <div className="mb-1">
      <label htmlFor={id} className="block text-xs font-medium text-cyan-200 mb-1">{label}</label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value || null) as T | null)}
        className="w-full bg-gray-800/50 border border-white/20 text-gray-100 text-xs rounded-soft focus:ring-cyan-400/50 focus:border-cyan-400/50 p-2 appearance-none custom-select transition-all duration-300 hover:border-white/30 focus:bg-gray-700/60"
      >
        <option value="">{anyLabel}</option>
        {options.map((o) => {
          const n = counts.get(o.value) ?? 0;
          return (
            <option key={o.value} value={o.value} disabled={n === 0 && value !== o.value}>
              {o.label} ({n})
            </option>
          );
        })}
      </select>
      {note && <p className="mt-1 text-[0.65rem] leading-snug text-slate-400">{note}</p>}
    </div>
  );
}

export function FilterControls() {
  const s = useFilterStore();
  const filters = filtersFromState(s);
  const unis = s.processedUniversities;

  const results = useMemo(
    () => unis.filter((u) => passesFilters(u, filters)).sort((a, b) => a.name.localeCompare(b.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unis, JSON.stringify(filters)]
  );
  const counts = useMemo(() => ({
    state: optionCounts(unis, filters, 'state', s.uniqueStates),
    program: optionCounts(unis, filters, 'program', SUBJECT_GROUPS as unknown as string[]),
    degree: optionCounts(unis, filters, 'degree', DEGREE_GROUPS as unknown as string[]),
    language: optionCounts(unis, filters, 'language', LANGUAGES as unknown as string[]),
    type: optionCounts(unis, filters, 'type', Object.keys(SCHOOL_TYPES)),
    semester: optionCounts(unis, filters, 'semester', ['winter', 'summer']),
    method: optionCounts(unis, filters, 'method', ['direct', 'uni-assist']),
    nc: optionCounts(unis, filters, 'nc', [true]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [unis, s.uniqueStates, JSON.stringify(filters)]);

  const anyActive = !!(s.activeStateFilter || s.activeProgramFilter || s.activeTypeFilter || s.activeSemesterFilter ||
    s.activeNcFilter !== null || s.activeApplicationMethodFilter || s.activeCourseLanguageFilter || s.activeDegreeFilter || s.searchQuery);
  const checked = (unis.find((u) => u.applicationMethodSource)?.applicationMethodSource as any)?.checked;
  const opts = (vals: readonly string[], label: (v: string) => string = (v) => v) => vals.map((v) => ({ value: v, label: label(v) }));

  return (
    <>
      <div className="mb-2 pb-2 border-b border-white/10">
        <p className="text-xs text-slate-300 mb-1">
          <span className="text-cyan-200 font-medium">{results.length}</span> of {unis.length} schools match
        </p>
        {anyActive && results.length > 0 && <ResultList schools={results} filters={filters} max="max-h-40" />}
        {results.length === 0 && <p className="text-[0.7rem] text-amber-200/90">Nothing matches all of these — loosen one of the filters below.</p>}
      </div>

      <FilterSelect id="subject-filter" label="Subject" anyLabel="All subjects" value={s.activeProgramFilter}
        options={opts(SUBJECT_GROUPS)} counts={counts.program} onChange={s.setActiveProgramFilter} />
      <FilterSelect id="degree-filter" label="Degree" anyLabel="All degrees" value={s.activeDegreeFilter}
        options={opts(DEGREE_GROUPS)} counts={counts.degree} onChange={s.setActiveDegreeFilter} />
      <FilterSelect id="language-filter" label="Language" anyLabel="Any language" value={s.activeCourseLanguageFilter}
        options={opts(LANGUAGES, (v) => LANGUAGE_LABELS[v])} counts={counts.language} onChange={s.setActiveCourseLanguageFilter} />
      <FilterSelect id="state-filter" label="State" anyLabel="All states" value={s.activeStateFilter}
        options={opts([...s.uniqueStates].sort())} counts={counts.state} onChange={s.setActiveStateFilter} />
      <FilterSelect id="type-filter" label="School type" anyLabel="All types" value={s.activeTypeFilter}
        options={opts(Object.keys(SCHOOL_TYPES), typeLabel)} counts={counts.type} onChange={s.setActiveTypeFilter} />
      <FilterSelect id="semester-filter" label="Start" anyLabel="Any semester" value={s.activeSemesterFilter}
        options={opts(['winter', 'summer'], (v) => SEMESTER_LABELS[v])} counts={counts.semester} onChange={s.setActiveSemesterFilter} />
      <FilterSelect id="method-filter" label="How you apply (international certificates)" anyLabel="Any route"
        value={s.activeApplicationMethodFilter} options={opts(['direct', 'uni-assist'], (v) => METHOD_LABELS[v]) as any}
        counts={counts.method} onChange={s.setActiveApplicationMethodFilter as any}
        note={<>uni-assist schools may route some programs through it — check the program page.{checked && <> Source: <a className="underline hover:text-slate-200" href="https://www.uni-assist.de/tools/uni-assist-hochschulen/" target="_blank" rel="noopener noreferrer">uni-assist list</a>, checked {checked}.</>}</>} />
      <div className="mb-1">
        <label htmlFor="nc-filter" className="block text-xs font-medium text-cyan-200 mb-1">NC-free (no grade cut-off)</label>
        <select
          id="nc-filter"
          value={s.activeNcFilter ? 'yes' : ''}
          onChange={(e) => s.setActiveNcFilter(e.target.value === 'yes' ? true : null)}
          className="w-full bg-gray-800/50 border border-white/20 text-gray-100 text-xs rounded-soft focus:ring-cyan-400/50 focus:border-cyan-400/50 p-2 appearance-none custom-select transition-all duration-300 hover:border-white/30 focus:bg-gray-700/60"
        >
          <option value="">Don&apos;t filter</option>
          <option value="yes">NC-free — portfolio, aptitude test or open admission ({counts.nc.get(true)})</option>
        </select>
        <p className="mt-1 text-[0.65rem] leading-snug text-slate-400">Art, music, film and drama schools select by aptitude test; elsewhere only programs we&apos;ve confirmed are shown — others may be NC-free too.</p>
      </div>

      {anyActive && (
        <button
          onClick={clearAllFilters}
          className="w-full mt-2 py-2 px-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-300 text-xs font-medium rounded-soft transition-all duration-300 flex items-center justify-center gap-2"
        >
          <X size={14} />
          Reset all
        </button>
      )}
    </>
  );
}
