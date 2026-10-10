'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useSchoolStore } from '@/stores/schoolStore';
import { Command, CommandInput, CommandList, CommandGroup, CommandItem } from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapPin, GraduationCap, Building2, Shapes, Users, CheckCircle, Snowflake, Sun, Globe } from 'lucide-react';
import { fold, matchScore as score, SUBJECT_GROUPS, subjectGroupOf, degreeAbbrev, SCHOOL_TYPES, typeLabel } from '@/lib/taxonomy';
import { METHOD_LABELS } from './FilterControls';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Result {
  key: string;
  title: string;
  detail?: string;
  icon: React.ReactNode;
  score: number;
  action: () => void;
}

const OPTION_TERMS: Array<{ key: string; terms: string[]; title: string; detail: string; icon: React.ReactNode; apply: () => void }> = [
  { key: 'nc', terms: ['nc', 'nc-free', 'numerus clausus'], title: 'NC-free programs', detail: 'Portfolio, aptitude test or open admission instead of a grade cut-off', icon: <CheckCircle className="h-4 w-4 text-green-400" />, apply: () => useSchoolStore.getState().setActiveNcFilter(true) },
  { key: 'direct', terms: ['direct', 'uni-assist', 'uniassist', 'apply', 'fee'], title: METHOD_LABELS.direct, detail: 'Schools you apply to directly', icon: <Globe className="h-4 w-4 text-orange-300" />, apply: () => useSchoolStore.getState().setActiveApplicationMethodFilter('direct') },
  { key: 'uni-assist', terms: ['uni-assist', 'uniassist', 'apply'], title: METHOD_LABELS['uni-assist'], detail: 'Schools that use uni-assist for international applicants', icon: <Globe className="h-4 w-4 text-orange-400" />, apply: () => useSchoolStore.getState().setActiveApplicationMethodFilter('uni-assist') },
  { key: 'winter', terms: ['winter', 'semester'], title: 'Winter semester intake', detail: 'Programs with a winter application window', icon: <Snowflake className="h-4 w-4 text-blue-300" />, apply: () => useSchoolStore.getState().setActiveSemesterFilter('winter') },
  { key: 'summer', terms: ['summer', 'semester'], title: 'Summer semester intake', detail: 'Programs with a summer application window', icon: <Sun className="h-4 w-4 text-yellow-300" />, apply: () => useSchoolStore.getState().setActiveSemesterFilter('summer') },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [search, setSearch] = useState('');
  const s = useSchoolStore((st) => ({
    processedUniversities: st.processedUniversities,
    uniqueStates: st.uniqueStates,
    programById: st.programById,
    universityById: st.universityById,
    setSearchQuery: st.setSearchQuery,
  }), shallow);

  const groups = useMemo(() => {
    const q = search.trim();
    if (!q) return [];
    const st = useSchoolStore.getState();
    const done = (fn: () => void) => () => { fn(); onClose(); };
    const count = (n: number, what: string) => `${n} ${what}${n === 1 ? '' : 's'}`;

    const schools: Result[] = s.processedUniversities.flatMap((u) => {
      const sc = Math.max(score(u.name, q), score(u.city || '', q) - 5, fold(u.description || '').includes(fold(q)) ? 40 : 0);
      return sc ? [{ key: u.id, title: u.name, detail: [u.city, u.state].filter(Boolean).join(', '), icon: <GraduationCap className="h-4 w-4 text-blue-400" />, score: sc,
        action: done(() => st.setSelectedUniversity(u)) }] : [];
    });

    const programs: Result[] = [...s.programById.entries()].flatMap(([id, { schoolId, schoolName, program }]) => {
      const sc = score(program.name, q);
      const u = s.universityById.get(schoolId);
      return sc && u ? [{ key: id, title: [program.name, degreeAbbrev(program.degree)].filter(Boolean).join(' · '), detail: schoolName,
        icon: <Building2 className="h-4 w-4 text-emerald-400" />, score: sc,
        action: done(() => { st.setSelectedUniversity(u); st.setSelectedProgramId(id); }) }] : [];
    });

    // subject groups: by name, or by what the query itself would be filed under ("Kommunikationsdesign")
    const guessed = subjectGroupOf(q);
    const subjects: Result[] = SUBJECT_GROUPS.flatMap((g) => {
      const sc = Math.max(score(g, q), g === guessed ? 75 : 0);
      if (!sc) return [];
      const n = s.processedUniversities.filter((u) => u.programs?.some((p) => subjectGroupOf(p.name) === g)).length;
      return [{ key: g, title: g, detail: `Show the ${count(n, 'school')} teaching this`, icon: <Shapes className="h-4 w-4 text-teal-300" />, score: sc,
        action: done(() => st.setActiveProgramFilter(g)) }];
    });

    const states: Result[] = s.uniqueStates.flatMap((state) => {
      const sc = score(state, q);
      const n = s.processedUniversities.filter((u) => u.state === state).length;
      return sc ? [{ key: state, title: state, detail: `Show the ${count(n, 'school')} in ${state}`, icon: <MapPin className="h-4 w-4 text-cyan-400" />, score: sc,
        action: done(() => st.setActiveStateFilter(state)) }] : [];
    });

    const types: Result[] = Object.keys(SCHOOL_TYPES).flatMap((t) => {
      const sc = score(typeLabel(t), q);
      const n = s.processedUniversities.filter((u) => u.type === t).length;
      return sc ? [{ key: t, title: typeLabel(t), detail: `Show ${count(n, 'school')} of this type`, icon: <Users className="h-4 w-4 text-purple-400" />, score: sc,
        action: done(() => st.setActiveTypeFilter(t)) }] : [];
    });

    const options: Result[] = q.length < 2 ? [] : OPTION_TERMS.flatMap((o) =>
      o.terms.some((t) => t.startsWith(fold(q)) || fold(q).startsWith(t))
        ? [{ key: o.key, title: o.title, detail: o.detail, icon: o.icon, score: 50, action: done(o.apply) }] : []);

    const top = (list: Result[], n: number) => list.sort((a, b) => b.score - a.score).slice(0, n);
    return [
      { heading: 'Schools', items: top(schools, 8) },
      { heading: 'Subjects', items: top(subjects, 3) },
      { heading: 'Programs', items: top(programs, 12) },
      { heading: 'States', items: top(states, 3) },
      { heading: 'School types', items: top(types, 3) },
      { heading: 'Filters', items: options },
    ].filter((g) => g.items.length);
  }, [search, s, onClose]);

  // the wall filters live as you type; closing the search clears it again
  useEffect(() => { s.setSearchQuery(search); }, [search, s]);
  useEffect(() => {
    if (!isOpen) { setSearch(''); s.setSearchQuery(''); }
  }, [isOpen, s]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-2xl w-[95vw] top-[12%] translate-y-0 border-white/10" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">Search schools, programs, subjects and states</DialogDescription>
        <Command shouldFilter={false} loop className="ui-organic max-h-[80vh]">
          <CommandInput
            placeholder="Search schools, programs, subjects, cities…"
            value={search}
            onValueChange={setSearch}
            className="h-12 text-base sm:text-sm text-white placeholder:text-slate-400"
          />
          <CommandList className="max-h-[60vh] overflow-y-auto bg-slate-900/95 px-2 pb-2">
            {search.trim() && groups.length === 0 && (
              <p className="text-slate-400 py-8 text-center text-sm">
                Nothing found for “{search}”. Try a school, a city, or a subject like “photography”.
              </p>
            )}
            {groups.map((g) => (
              <CommandGroup key={g.heading} heading={g.heading} className="text-cyan-300 text-xs font-semibold tracking-wide [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1">
                {g.items.map((r) => (
                  <CommandItem
                    key={g.heading + r.key}
                    value={g.heading + r.key}
                    onSelect={r.action}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-soft text-white aria-selected:bg-slate-700/70"
                  >
                    {r.icon}
                    <span className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-sm truncate">{r.title}</span>
                      {r.detail && <span className="text-xs font-normal text-slate-400 truncate">{r.detail}</span>}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {!search.trim() && (
              <div className="px-6 py-8 text-center text-sm text-slate-400 space-y-2">
                <p className="text-white">Find a school, a program or a subject</p>
                <p>“UdK” · “Leipzig” · “Kommunikationsdesign” · “photography” · “uni-assist”</p>
                <p className="text-xs text-slate-500 pt-2">↑↓ to move · Enter to open · Esc to close</p>
              </div>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
