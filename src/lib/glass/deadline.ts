/**
 * Deadline → storm weight.
 *
 * Shared, lightweight version used by the atmosphere driver to turn application
 * deadlines into weather. (SchoolMarker keeps its own richer urgency labels for
 * the per-node ring; this only needs a 0..1 storm weight.)
 */

import { ProcessedUniversity } from '@/stores/schoolStore';
import { ATMO } from '@/components/map/atmosphere/config';

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function parseDeadlineDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  const month = MONTHS[parts[1].toLowerCase()];
  if (isNaN(day) || month === undefined) return null;
  return new Date(new Date().getFullYear(), month, day);
}

/** Days until the closest still-open deadline, or null if none. */
export function daysUntilClosestDeadline(school: ProcessedUniversity): number | null {
  const programs = school.programs;
  if (!programs || programs.length === 0) return null;
  const now = Date.now();
  let closest: number | null = null;
  for (const program of programs) {
    const dl = program.applicationDeadlines;
    if (!dl) continue;
    for (const semester of ['winter', 'summer'] as const) {
      const end = parseDeadlineDate(dl[semester]?.end);
      if (!end) continue;
      const days = Math.ceil((end.getTime() - now) / 86_400_000);
      if (days >= -1 && (closest === null || days < closest)) closest = days;
    }
  }
  return closest;
}

/** 0 (calm) … 1 (urgent storm) for a single school. */
export function stormWeight(school: ProcessedUniversity): number {
  const d = daysUntilClosestDeadline(school);
  if (d === null) return 0;
  const { urgentDays, soonDays, approachingDays } = ATMO.deadlineStorm;
  if (d <= urgentDays) return 1.0;
  if (d <= soonDays) return 0.6;
  if (d <= approachingDays) return 0.3;
  return 0.12;
}

/** Aggregate storm weight across a set — peak-weighted so any looming deadline is felt. */
export function aggregateStorm(schools: ProcessedUniversity[]): number {
  if (schools.length === 0) return 0.1;
  let peak = 0, sum = 0;
  for (const s of schools) {
    const w = stormWeight(s);
    peak = Math.max(peak, w);
    sum += w;
  }
  return 0.7 * peak + 0.3 * (sum / schools.length);
}
