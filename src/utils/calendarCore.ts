/** RFC 5545 content lines. No alarms, recurring rules or external calendar service. */
export function escapeCalendarText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
}

export function foldCalendarLine(value: string): string {
  const encoder = new TextEncoder()
  const lines: string[] = []
  let line = '', bytes = 0
  for (const char of value) {
    const size = encoder.encode(char).length
    if (bytes + size > 75) { lines.push(line); line = ' '; bytes = 1 }
    line += char; bytes += size
  }
  lines.push(line)
  return lines.join('\r\n')
}

export function calendarUid(identity: string): string {
  // Two independent 32-bit accumulators; stable across exports, not a security token.
  let a = 2166136261, b = 5381
  for (const byte of new TextEncoder().encode(identity)) { a = Math.imul(a ^ byte, 16777619) >>> 0; b = (Math.imul(b, 33) ^ byte) >>> 0 }
  return `${a.toString(16).padStart(8,'0')}${b.toString(16).padStart(8,'0')}@german-art-schools`
}

export interface CalendarEvent {
  uid: string
  date: string // YYYY-MM-DD, all-day reminder of a closing date, not an invented cutoff time
  summary: string
  description: string
  url?: string
}

export function serializeCalendar(events: CalendarEvent[], now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//German Art Schools//Kept deadlines//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Kept program deadlines']
  const seen = new Set<string>()
  for (const event of events) {
    if (seen.has(event.uid)) continue
    seen.add(event.uid)
    const date = new Date(`${event.date}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || event.date.slice(0,4) > '9998' || Number.isNaN(+date) || date.toISOString().slice(0, 10) !== event.date) throw new Error(`Invalid calendar date: ${event.date}`)
    const end = new Date(+date + 86400000).toISOString().slice(0, 10).replace(/-/g, '')
    lines.push('BEGIN:VEVENT', `UID:${escapeCalendarText(event.uid)}`, `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, `DTSTART;VALUE=DATE:${event.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${escapeCalendarText(event.summary)}`, `DESCRIPTION:${escapeCalendarText(event.description)}`, 'TRANSP:TRANSPARENT')
    // URI values aren't TEXT values. Remove content-line injection, not URI delimiters.
    if (event.url && /^https?:\/\//i.test(event.url) && !/[\r\n\u0000]/.test(event.url)) lines.push(`URL:${event.url}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldCalendarLine).join('\r\n') + '\r\n'
}
