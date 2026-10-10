'use client'

/**
 * FilterWizard — the guided, subtitle-style entry flow.
 *
 * Filters are THE primary interaction. The wizard starts collapsed behind a
 * "Guide me" pill so the glass wall is the first thing the user sees; opening
 * it asks one question at a time (shown like a film subtitle); each answer
 * breaks the glass wall further. Every option shows how many schools it
 * leaves, options that would leave none are hidden, and the last screen lists
 * the matching schools. "All filters" hands over to the full filter panel.
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { Filters, filtersFromState, countMatches, optionCounts, passesFilters } from '@/lib/glass/filter';
import { SUBJECT_GROUPS, DEGREE_GROUPS, LANGUAGES, SCHOOL_TYPES, typeLabel } from '@/lib/taxonomy';
import { useFilterStore, ResultList, LANGUAGE_LABELS, METHOD_LABELS } from './FilterControls';

interface Option { value: string; label: string }
interface Step {
  key: keyof Filters;
  eyebrow: string;
  prompt: string;
  hint?: string;
  value: string | null;
  set: (v: any) => void;
  options: Option[];
}

export function FilterWizard() {
  const s = useFilterStore();
  const open = useMapStore((m) => m.wizardOpen);
  const setOpen = useMapStore((m) => m.setWizardOpen);
  const setActivePanel = useMapStore((m) => m.setActivePanel);
  const [step, setStep] = useState(0);

  const steps: Step[] = useMemo(() => ([
    {
      key: 'state', eyebrow: 'Where', prompt: 'Where in Germany do you want to be?',
      value: s.activeStateFilter, set: s.setActiveStateFilter,
      options: [...s.uniqueStates].sort().map((v) => ({ value: v, label: v })),
    },
    {
      key: 'type', eyebrow: 'Kind of school', prompt: 'What kind of place are you after?',
      value: s.activeTypeFilter, set: s.setActiveTypeFilter,
      options: Object.keys(SCHOOL_TYPES).map((v) => ({ value: v, label: typeLabel(v) })),
    },
    {
      key: 'program', eyebrow: 'Subject', prompt: 'What do you want to make?',
      value: s.activeProgramFilter, set: s.setActiveProgramFilter,
      options: SUBJECT_GROUPS.map((v) => ({ value: v, label: v })),
    },
    {
      key: 'degree', eyebrow: 'Degree', prompt: 'How far do you want to take it?',
      value: s.activeDegreeFilter, set: s.setActiveDegreeFilter,
      options: DEGREE_GROUPS.map((v) => ({ value: v, label: v })),
    },
    {
      key: 'language', eyebrow: 'Language', prompt: 'In which language?',
      value: s.activeCourseLanguageFilter, set: s.setActiveCourseLanguageFilter,
      options: LANGUAGES.map((v) => ({ value: v, label: LANGUAGE_LABELS[v] })),
    },
    {
      key: 'method', eyebrow: 'Applying', prompt: 'Do application handling fees matter?',
      hint: 'For non-German qualifications. uni-assist charges €75 first and €30 for each extra application per semester. Sourced programme routes take priority; direct submission alone does not waive credential-validation fees.',
      value: s.activeApplicationMethodFilter, set: s.setActiveApplicationMethodFilter,
      options: ['direct', 'uni-assist'].map((v) => ({ value: v, label: METHOD_LABELS[v] })),
    },
  ]), [s]);

  const filters = filtersFromState(s);
  const total = s.processedUniversities.length;
  const remaining = countMatches(s.processedUniversities, filters);

  const done = step >= steps.length;
  const cur = steps[Math.min(step, steps.length - 1)];
  // counts with this step's own answer lifted, so every option is comparable
  const counts = useMemo(
    () => optionCounts(s.processedUniversities, { ...filters, [cur.key]: null }, cur.key, cur.options.map((o) => o.value) as any),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.processedUniversities, cur, JSON.stringify(filters)]
  );
  const anyCount = countMatches(s.processedUniversities, { ...filters, [cur.key]: null });

  const results = useMemo(
    () => (done ? s.processedUniversities.filter((u) => passesFilters(u, filters)).sort((a, b) => a.name.localeCompare(b.name)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [done, s.processedUniversities, JSON.stringify(filters)]
  );

  const next = () => setStep((i) => Math.min(i + 1, steps.length));
  const choose = (v: string | null) => { cur.set(v); next(); };
  const startOver = () => { steps.forEach((st) => st.set(null)); setStep(0); };
  const undoLast = () => {
    const last = [...steps.keys()].reverse().find((i) => steps[i].value != null);
    if (last == null) return startOver();
    steps[last].set(null);
    setStep(last);
  };
  const toAllFilters = () => { setOpen(false); setActivePanel('filters'); };

  // collapsed launcher
  if (!open) {
    return (
      <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 pointer-events-none">
        <button
          onClick={() => setOpen(true)}
          className="pointer-events-auto rounded-full border border-cyan-300/30 bg-black/50 backdrop-blur-md px-5 py-2 text-sm text-cyan-100 tracking-wide hover:bg-black/70 hover:border-cyan-300/60 transition"
        >
          ✦ Guide me
        </button>
      </div>
    );
  }

  const chip = (selected: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm border transition ${
      selected
        ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-100'
        : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-cyan-300/40'
    }`;

  return (
    // z-40: above the corner buttons (2D toggle, music) that share the bottom edge on phones
    <div className="fixed inset-x-0 bottom-4 sm:bottom-6 z-40 flex justify-center px-3 sm:px-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-t from-black/80 to-black/45 backdrop-blur-md px-5 sm:px-6 py-4 sm:py-5 shadow-2xl"
        role="dialog"
        aria-label="Guided search"
      >
        {/* header: progress + remaining + exits */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step && !done ? 'w-6 bg-cyan-300' : i < step || done ? 'w-3 bg-cyan-300/50' : 'w-3 bg-white/15'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-[11px] tracking-widest uppercase text-slate-400" aria-live="polite">
              <span className="text-cyan-200 font-medium">{remaining}</span><span className="hidden sm:inline"> / {total}</span> schools
            </span>
            <button onClick={toAllFilters} className="text-[11px] tracking-widest uppercase text-slate-400 hover:text-slate-200 transition">
              All filters
            </button>
            <button onClick={() => setOpen(false)} aria-label="Close guide" className="text-slate-400 hover:text-white transition text-lg leading-none px-1">
              ×
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="py-1"
            >
              {remaining === 0 ? (
                <>
                  <p className="text-xl font-light text-slate-50 mb-1">No school matches all of these.</p>
                  <p className="text-sm text-slate-400 mb-4">Undo your last answer, or change any step above.</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={undoLast} className="rounded-full border border-cyan-300/50 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-100 hover:bg-cyan-400/20 transition">Undo last choice</button>
                    <button onClick={startOver} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-200 hover:bg-white/10 transition">Start over</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">The window has broken down to</p>
                  <p className="text-2xl font-light text-slate-50 mb-2">
                    {remaining} <span className="text-base text-slate-400">{remaining === 1 ? 'school' : 'schools'}</span>
                  </p>
                  <ResultList schools={results} filters={filters} max="max-h-[28vh]" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button onClick={() => setStep(0)} className="rounded-full border border-cyan-300/50 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-100 hover:bg-cyan-400/20 transition">Refine</button>
                    <button onClick={startOver} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-200 hover:bg-white/10 transition">Start over</button>
                    <button onClick={() => setOpen(false)} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-200 hover:bg-white/10 transition">Back to the wall</button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={cur.key}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">
                Step {step + 1} of {steps.length} · {cur.eyebrow}
              </p>
              <h2 className="text-xl sm:text-2xl font-light text-slate-50 tracking-wide mb-1">{cur.prompt}</h2>
              {cur.hint && <p className="text-xs text-slate-400 mb-2">{cur.hint}</p>}

              <div className="flex flex-wrap gap-2 max-h-[30vh] overflow-y-auto pr-1 mt-3">
                <button onClick={() => choose(null)} className={chip(cur.value == null)}>
                  Any <span className="text-slate-400">· {anyCount}</span>
                </button>
                {cur.options
                  .filter((o) => (counts.get(o.value as any) ?? 0) > 0 || cur.value === o.value)
                  .map((o) => (
                    <button key={o.value} onClick={() => choose(o.value)} className={chip(cur.value === o.value)}>
                      {o.label} <span className="text-slate-400">· {counts.get(o.value as any) ?? 0}</span>
                    </button>
                  ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setStep((i) => Math.max(i - 1, 0))}
                  disabled={step === 0}
                  className="text-sm text-slate-400 hover:text-slate-200 disabled:opacity-0 transition"
                >
                  ← Back
                </button>
                <button onClick={next} className="text-sm text-slate-300 hover:text-cyan-200 transition">
                  {cur.value == null ? 'Skip' : 'Keep'} →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
