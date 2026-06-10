// Deadline utility functions for German art school application deadlines

export interface DeadlineStatus {
  status: 'open' | 'closing-soon' | 'closed' | 'upcoming';
  daysRemaining: number;
  label: string;
  color: string; // Tailwind color class
}

export interface UpcomingDeadline {
  schoolName: string;
  programName: string;
  semester: 'winter' | 'summer';
  deadline: DeadlineWindow;
  status: DeadlineStatus;
}

/** Some schools only publish a submission deadline, so `start` is optional. */
export interface DeadlineWindow {
  start?: string;
  end?: string;
}

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3,
  may: 4, june: 5, july: 6, august: 7,
  september: 8, october: 9, november: 10, december: 11,
};

/**
 * Parse deadline date strings like "1 May", "15 June" into Date objects.
 * If the date has already passed this year, returns next year's date.
 */
export function parseDeadlineDate(dateStr: string, year?: number): Date {
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) throw new Error(`Invalid deadline date: "${dateStr}"`);

  const day = parseInt(parts[0], 10);
  const monthName = parts[1].toLowerCase();
  const month = MONTHS[monthName];

  if (isNaN(day) || month === undefined) {
    throw new Error(`Cannot parse deadline date: "${dateStr}"`);
  }

  const now = new Date();
  const resolvedYear = year ?? now.getFullYear();
  const date = new Date(resolvedYear, month, day);

  // If no explicit year and the date has passed, use next year
  if (year === undefined && date < now) {
    date.setFullYear(resolvedYear + 1);
  }

  return date;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((b.getTime() - a.getTime()) / msPerDay);
}

function tryParseDeadlineDate(dateStr: string | undefined, year?: number): Date | null {
  if (!dateStr) return null;
  try {
    return parseDeadlineDate(dateStr, year);
  } catch {
    return null;
  }
}

/**
 * Get the status of a deadline period (start → end).
 * Handles year-boundary crossing (e.g. Dec start → Jan end for summer semester).
 * Windows without a start date are treated as open until the deadline.
 * Returns null when the window has no parseable end date.
 */
export function getDeadlineStatus(deadline: DeadlineWindow): DeadlineStatus | null {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Deadline-only window (no published opening date)
  if (!tryParseDeadlineDate(deadline.start, currentYear)) {
    let endOnly = tryParseDeadlineDate(deadline.end);
    if (!endOnly) return null;
    const days = daysBetween(now, endOnly);
    if (days <= 14) {
      return {
        status: 'closing-soon',
        daysRemaining: days,
        label: days <= 1 ? 'Last day!' : `${days} days left`,
        color: 'text-red-400 bg-red-500/20 border-red-500/50',
      };
    }
    if (days <= 120) {
      return {
        status: 'open',
        daysRemaining: days,
        label: `${days} days left`,
        color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50',
      };
    }
    return {
      status: 'upcoming',
      daysRemaining: days,
      label: `Deadline in ${days} days`,
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/50',
    };
  }

  // Parse start and end for current year first
  let startDate = parseDeadlineDate(deadline.start!, currentYear);
  let endDate = tryParseDeadlineDate(deadline.end, currentYear);
  if (!endDate) return null;

  // Handle year-boundary: if end is before start (e.g. Dec → Jan), push end to next year
  if (endDate <= startDate) {
    endDate = parseDeadlineDate(deadline.end!, currentYear + 1);
  }

  // If the entire window has passed, shift both to next cycle
  if (now > endDate) {
    startDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
    endDate = new Date(endDate.getFullYear() + 1, endDate.getMonth(), endDate.getDate());
    // Re-check boundary
    if (endDate <= startDate) {
      endDate = new Date(endDate.getFullYear() + 1, endDate.getMonth(), endDate.getDate());
    }
  }

  const daysUntilEnd = daysBetween(now, endDate);
  const daysUntilStart = daysBetween(now, startDate);

  // Currently within the application window
  if (now >= startDate && now <= endDate) {
    if (daysUntilEnd <= 14) {
      return {
        status: 'closing-soon',
        daysRemaining: daysUntilEnd,
        label: daysUntilEnd <= 1 ? 'Last day!' : `${daysUntilEnd} days left`,
        color: 'text-red-400 bg-red-500/20 border-red-500/50',
      };
    }
    return {
      status: 'open',
      daysRemaining: daysUntilEnd,
      label: `${daysUntilEnd} days left`,
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50',
    };
  }

  // Upcoming (within 90 days of opening)
  if (now < startDate && daysUntilStart <= 90) {
    return {
      status: 'upcoming',
      daysRemaining: daysUntilStart,
      label: `Opens in ${daysUntilStart} days`,
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/50',
    };
  }

  // Closed / far future
  return {
    status: 'closed',
    daysRemaining: daysUntilStart > 0 ? daysUntilStart : 0,
    label: 'Closed',
    color: 'text-gray-400 bg-gray-500/20 border-gray-500/50',
  };
}

/**
 * Returns the most relevant (open > closing-soon > upcoming) deadline
 * from winter/summer options.
 */
export function getNextDeadline(
  deadlines: {
    winter?: DeadlineWindow;
    summer?: DeadlineWindow;
  }
): { semester: 'winter' | 'summer'; deadline: DeadlineWindow; status: DeadlineStatus } | null {
  const candidates: Array<{
    semester: 'winter' | 'summer';
    deadline: DeadlineWindow;
    status: DeadlineStatus;
  }> = [];

  for (const semester of ['winter', 'summer'] as const) {
    const window = deadlines[semester];
    if (!window) continue;
    const status = getDeadlineStatus(window);
    if (status) candidates.push({ semester, deadline: window, status });
  }

  if (candidates.length === 0) return null;

  // Priority: closing-soon > open > upcoming > closed
  const priority: Record<string, number> = {
    'closing-soon': 0,
    'open': 1,
    'upcoming': 2,
    'closed': 3,
  };

  candidates.sort((a, b) => {
    const pa = priority[a.status.status] ?? 4;
    const pb = priority[b.status.status] ?? 4;
    if (pa !== pb) return pa - pb;
    return a.status.daysRemaining - b.status.daysRemaining;
  });

  return candidates[0];
}

/**
 * Flatten all deadlines across all universities/programs,
 * sorted by urgency (closing-soon first, then open, then upcoming).
 */
export function getAllUpcomingDeadlines(
  universities: Array<{
    name: string;
    programs: Array<{
      name: string;
      applicationDeadlines?: {
        winter?: DeadlineWindow;
        summer?: DeadlineWindow;
      };
    }>;
  }>
): UpcomingDeadline[] {
  const results: UpcomingDeadline[] = [];

  for (const uni of universities) {
    if (!uni.programs) continue;
    for (const prog of uni.programs) {
      if (!prog.applicationDeadlines) continue;
      const dl = prog.applicationDeadlines;

      for (const semester of ['winter', 'summer'] as const) {
        const d = dl[semester];
        if (!d) continue;
        const status = getDeadlineStatus(d);
        if (!status) continue;
        // Only include non-closed deadlines
        if (status.status !== 'closed') {
          results.push({
            schoolName: uni.name,
            programName: prog.name,
            semester,
            deadline: d,
            status,
          });
        }
      }
    }
  }

  const priority: Record<string, number> = {
    'closing-soon': 0,
    'open': 1,
    'upcoming': 2,
  };

  results.sort((a, b) => {
    const pa = priority[a.status.status] ?? 3;
    const pb = priority[b.status.status] ?? 3;
    if (pa !== pb) return pa - pb;
    return a.status.daysRemaining - b.status.daysRemaining;
  });

  return results;
}
