// iCal (.ics) export utility for German art school deadlines
// RFC 5545 compliant — no external dependencies

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3,
  may: 4, june: 5, july: 6, august: 7,
  september: 8, october: 9, november: 10, december: 11,
};

/**
 * Convert "15 June" to iCal date format "20260615".
 * If the date has passed this year, uses next year.
 */
function parseDeadlineDateToICal(dateStr: string, year?: number): string {
  const parts = dateStr.trim().split(/\s+/);
  const day = parseInt(parts[0], 10);
  const monthName = parts[1].toLowerCase();
  const month = MONTHS[monthName];

  if (isNaN(day) || month === undefined) {
    throw new Error(`Cannot parse date: "${dateStr}"`);
  }

  const now = new Date();
  let resolvedYear = year ?? now.getFullYear();
  const date = new Date(resolvedYear, month, day);

  if (year === undefined && date < now) {
    resolvedYear += 1;
  }

  const y = resolvedYear.toString();
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Generate a unique ID for an iCal event.
 */
function generateUID(school: string, program: string, semester: string): string {
  const base = `${school}-${program}-${semester}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const hash = base.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
  return `${Math.abs(hash).toString(36)}-${base.slice(0, 30)}@german-art-schools`;
}

/**
 * Fold long lines per RFC 5545 (max 75 octets per line).
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  parts.push(line.slice(0, 75));
  let remaining = line.slice(75);
  while (remaining.length > 0) {
    parts.push(' ' + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return parts.join('\r\n');
}

/**
 * Get current timestamp in iCal format.
 */
function nowStamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate a single VEVENT string.
 */
export function generateICalEvent(params: {
  schoolName: string;
  programName: string;
  semester: 'winter' | 'summer';
  deadline: { start?: string; end: string };
  website?: string;
}): string {
  const { schoolName, programName, semester, deadline, website } = params;
  // Deadline-only windows (no published opening date) become single-day events
  const dtStart = parseDeadlineDateToICal(deadline.start ?? deadline.end);
  const dtEnd = parseDeadlineDateToICal(deadline.end);
  const uid = generateUID(schoolName, programName, semester);
  const stamp = nowStamp();

  const summary = `${schoolName} - ${programName} (${semester} semester)`;
  let description = `Application period for ${programName} at ${schoolName}.\\n${semester.charAt(0).toUpperCase() + semester.slice(1)} semester.${deadline.start ? `\\nOpens: ${deadline.start}` : ''}\\nCloses: ${deadline.end}`;
  if (website) {
    description += `\\nWebsite: ${website}`;
  }

  // VALARM: 7 days before end date
  const endDate = new Date(
    parseInt(dtEnd.slice(0, 4)),
    parseInt(dtEnd.slice(4, 6)) - 1,
    parseInt(dtEnd.slice(6, 8))
  );
  const alarmDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const alarmTrigger = `-P7D`;

  const lines = [
    'BEGIN:VEVENT',
    foldLine(`UID:${uid}`),
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    foldLine(`SUMMARY:${summary}`),
    foldLine(`DESCRIPTION:${description}`),
    website ? foldLine(`URL:${website}`) : '',
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    `TRIGGER:${alarmTrigger}`,
    'ACTION:DISPLAY',
    foldLine(`DESCRIPTION:Deadline approaching: ${summary}`),
    'END:VALARM',
    'END:VEVENT',
  ].filter(Boolean);

  return lines.join('\r\n');
}

/**
 * Wrap multiple events in a full VCALENDAR.
 */
export function generateICalFile(
  events: Array<{
    schoolName: string;
    programName: string;
    semester: string;
    deadline: { start?: string; end: string };
    website?: string;
  }>
): string {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//German Art Schools//Deadline Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:German Art Schools Deadlines',
    'X-WR-TIMEZONE:Europe/Berlin',
  ].join('\r\n');

  const eventStrings = events.map((e) =>
    generateICalEvent({
      ...e,
      semester: e.semester as 'winter' | 'summer',
    })
  );

  return header + '\r\n' + eventStrings.join('\r\n') + '\r\nEND:VCALENDAR\r\n';
}

/**
 * Trigger a browser download of an .ics file.
 */
export function downloadICalFile(
  content: string,
  filename: string = 'german-art-schools-deadlines.ics'
): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a full .ics file for all deadlines of one school.
 */
export function generateSchoolICalFile(school: {
  name: string;
  website?: string;
  programs: Array<{
    name: string;
    applicationDeadlines?: {
      winter?: { start?: string; end?: string };
      summer?: { start?: string; end?: string };
    };
  }>;
}): string {
  const events: Array<{
    schoolName: string;
    programName: string;
    semester: string;
    deadline: { start?: string; end: string };
    website?: string;
  }> = [];

  for (const prog of school.programs) {
    if (!prog.applicationDeadlines) continue;
    for (const semester of ['winter', 'summer'] as const) {
      const dl = prog.applicationDeadlines[semester];
      if (dl?.end) {
        events.push({
          schoolName: school.name,
          programName: prog.name,
          semester,
          deadline: { start: dl.start, end: dl.end },
          website: school.website,
        });
      }
    }
  }

  return generateICalFile(events);
}

/**
 * Generate a full .ics file for ALL school deadlines.
 */
export function generateAllDeadlinesICalFile(
  universities: Array<{
    name: string;
    website?: string;
    programs: Array<{
      name: string;
      applicationDeadlines?: {
        winter?: { start?: string; end?: string };
        summer?: { start?: string; end?: string };
      };
    }>;
  }>
): string {
  const events: Array<{
    schoolName: string;
    programName: string;
    semester: string;
    deadline: { start?: string; end: string };
    website?: string;
  }> = [];

  for (const uni of universities) {
    if (!uni.programs) continue;
    for (const prog of uni.programs) {
      if (!prog.applicationDeadlines) continue;
      for (const semester of ['winter', 'summer'] as const) {
        const dl = prog.applicationDeadlines[semester];
        if (dl?.end) {
          events.push({
            schoolName: uni.name,
            programName: prog.name,
            semester,
            deadline: { start: dl.start, end: dl.end },
            website: uni.website,
          });
        }
      }
    }
  }

  return generateICalFile(events);
}
