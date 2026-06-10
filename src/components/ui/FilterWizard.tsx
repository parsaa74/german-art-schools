'use client'

/**
 * FilterWizard — the guided, subtitle-style entry flow.
 *
 * Filters are THE primary interaction. The wizard starts collapsed behind a
 * "Guide me" pill so the glass wall is the first thing the user sees; opening
 * it asks one question at a time (shown like a film subtitle); each answer
 * breaks the glass wall further and ramps the storm. A live count shows how
 * many schools remain. The user can skip any step, go back, start over, or
 * drop out to the full filter panel ("All filters").
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { shallow } from 'zustand/shallow';
import { useSchoolStore } from '@/stores/schoolStore';
import { filtersFromState, countMatches } from '@/lib/glass/filter';

const TYPE_LABELS: Record<string, string> = {
  art_academy: 'Art academy',
  kunsthochschule: 'Kunsthochschule',
  design_school: 'Design school',
  university_of_arts: 'University of the arts',
  film_university: 'Film university',
  university: 'University',
};

// Prettify any unmapped raw value like "music_theater_academy" → "Music theater academy".
function prettify(v: string): string {
  const s = v.replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Option { value: string; label: string }
interface Step {
  key: string;
  eyebrow: string;
  prompt: string;
  value: string | null;
  set: (v: string | null) => void;
  options: Option[];
}

export function FilterWizard() {
  const s = useSchoolStore((st) => ({
    processedUniversities: st.processedUniversities,
    uniqueStates: st.uniqueStates,
    uniqueProgramTypes: st.uniqueProgramTypes,
    uniqueCourseLanguages: st.uniqueCourseLanguages,
    uniqueDegreeTypes: st.uniqueDegreeTypes,
    activeStateFilter: st.activeStateFilter,
    activeProgramFilter: st.activeProgramFilter,
    activeTypeFilter: st.activeTypeFilter,
    activeSemesterFilter: st.activeSemesterFilter,
    activeNcFilter: st.activeNcFilter,
    activeApplicationMethodFilter: st.activeApplicationMethodFilter,
    activeCourseLanguageFilter: st.activeCourseLanguageFilter,
    activeDegreeFilter: st.activeDegreeFilter,
    timelineFilter: st.timelineFilter,
    searchQuery: st.searchQuery,
    setActiveStateFilter: st.setActiveStateFilter,
    setActiveProgramFilter: st.setActiveProgramFilter,
    setActiveTypeFilter: st.setActiveTypeFilter,
    setActiveCourseLanguageFilter: st.setActiveCourseLanguageFilter,
    setActiveDegreeFilter: st.setActiveDegreeFilter,
  }), shallow);

  const [step, setStep] = useState(0);
  // starts collapsed — the wall is the first thing the user sees, the wizard
  // waits behind the "Guide me" pill
  const [open, setOpen] = useState(false);

  const types = useMemo(() => {
    const set = new Set<string>();
    s.processedUniversities.forEach((u) => u.type && set.add(u.type));
    const order = Object.keys(TYPE_LABELS);
    return [...set].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [s.processedUniversities]);

  const steps: Step[] = useMemo(() => ([
    {
      key: 'state', eyebrow: 'Where', prompt: 'Where in Germany do you want to be?',
      value: s.activeStateFilter, set: s.setActiveStateFilter,
      options: [...s.uniqueStates].sort().map((v) => ({ value: v, label: v })),
    },
    {
      key: 'type', eyebrow: 'Kind of school', prompt: 'What kind of place are you after?',
      value: s.activeTypeFilter, set: s.setActiveTypeFilter,
      options: types.map((v) => ({ value: v, label: TYPE_LABELS[v] || prettify(v) })),
    },
    {
      key: 'program', eyebrow: 'Subject', prompt: 'What do you want to make?',
      value: s.activeProgramFilter, set: s.setActiveProgramFilter,
      options: [...s.uniqueProgramTypes].sort().map((v) => ({ value: v, label: v })),
    },
    {
      key: 'degree', eyebrow: 'Degree', prompt: 'How far do you want to take it?',
      value: s.activeDegreeFilter, set: s.setActiveDegreeFilter,
      options: [...s.uniqueDegreeTypes].sort().map((v) => ({ value: v, label: v })),
    },
    {
      key: 'language', eyebrow: 'Language', prompt: 'In which language?',
      value: s.activeCourseLanguageFilter, set: s.setActiveCourseLanguageFilter,
      options: [...s.uniqueCourseLanguages].sort().map((v) => ({ value: v, label: v })),
    },
  ].filter((st) => st.options.length > 0)), [s, types]);

  const total = s.processedUniversities.length;
  const remaining = useMemo(
    () => countMatches(s.processedUniversities, filtersFromState(s)),
    [s]
  );

  const done = step >= steps.length;
  const cur = steps[Math.min(step, steps.length - 1)];

  const next = () => setStep((i) => Math.min(i + 1, steps.length));
  const choose = (v: string | null) => { cur.set(v); next(); };
  const startOver = () => { steps.forEach((st) => st.set(null)); setStep(0); };

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

  return (
    <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-t from-black/75 to-black/35 backdrop-blur-md px-6 py-5 shadow-2xl"
      >
        {/* header: progress + remaining + close */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step && !done ? 'w-6 bg-cyan-300' : i < step || done ? 'w-3 bg-cyan-300/50' : 'w-3 bg-white/15'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] tracking-widest uppercase text-slate-400">
              <span className="text-cyan-200 font-medium">{remaining}</span> / {total} remain
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] tracking-widest uppercase text-slate-500 hover:text-slate-300 transition"
            >
              All filters
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
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">The window has broken down to</p>
              <p className="text-3xl font-light text-slate-50 mb-3">
                {remaining} <span className="text-lg text-slate-400">{remaining === 1 ? 'school' : 'schools'}</span>
              </p>
              <p className="text-sm text-slate-400 mb-4">Click a shard to explore it — or keep refining.</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setStep(0)} className="rounded-full border border-cyan-300/50 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-100 hover:bg-cyan-400/20 transition">Refine</button>
                <button onClick={startOver} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-200 hover:bg-white/10 transition">Start over</button>
                <button onClick={() => setOpen(false)} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-200 hover:bg-white/10 transition">Explore</button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={cur.key}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">
                Step {step + 1} · {cur.eyebrow}
              </p>
              <h2 className="text-xl sm:text-2xl font-light text-slate-50 tracking-wide mb-4">{cur.prompt}</h2>

              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                <button
                  onClick={() => choose(null)}
                  className={`rounded-full px-3.5 py-1.5 text-sm border transition ${
                    cur.value == null
                      ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-100'
                      : 'border-white/15 bg-white/5 text-slate-300 italic hover:bg-white/10 hover:border-white/25'
                  }`}
                >
                  Any
                </button>
                {cur.options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => choose(o.value)}
                    className={`rounded-full px-3.5 py-1.5 text-sm border transition ${
                      cur.value === o.value
                        ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-100'
                        : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-cyan-300/40'
                    }`}
                  >
                    {o.label}
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
                  Skip →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
