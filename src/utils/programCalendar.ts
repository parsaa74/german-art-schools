import { calendarUid, serializeCalendar, type CalendarEvent } from './calendarCore'

interface Program {
  program_id: string
  name: string
  degree?: string
  applicationDeadlines?: Record<string, {start?: string | null; end?: string | null} | undefined>
  otherDeadlines?: Array<{kind: string; semester?: string | null; start?: string | null; end?: string | null; scope?: string; recurring?: boolean; cycle?: string | null; source?: string}>
  sources?: Record<string, unknown>
  details?: {programUrl?: string; applicationUrl?: string; programPageNotes?: string}
  status?: {status: string}
}
export interface CalendarProgram { program: Program; school: {id: string; name: string; website?: string} }
export interface PlannedDeadline extends CalendarEvent { programId: string; programName: string; schoolName: string; kind: string; scope?: string; assumedYear: boolean }
export interface CalendarPlan {
  events: PlannedDeadline[]
  skipped: Array<{programId: string; name: string; reason: string}>
  programsWithDates: number
  undatedCount: number
}
const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december']
const KINDS: Record<string,string> = {application:'Application closes', portfolio:'Portfolio due', 'aptitude-registration':'Aptitude registration closes', audition:'Audition registration deadline', 'uni-assist':'uni-assist deadline', vpd:'VPD deadline'}

/** Germany's calendar day, independent of the viewer's timezone. */
function todayInBerlin(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now)
  const p = Object.fromEntries(parts.map(p => [p.type,p.value]))
  return `${p.year}-${p.month}-${p.day}`
}
function dateParts(value: string): {year?: number; month: number; day: number} | null {
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (m) return {year:+m[1],month:+m[2],day:+m[3]}
  m = /^(\d{2})-(\d{2})$/.exec(value.trim())
  if (m) return {month:+m[1],day:+m[2]}
  m = /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/i.exec(value.trim())
  if (!m) return null
  const month = MONTHS.indexOf(m[2].toLowerCase()) + 1
  return month ? {year:m[3]?+m[3]:undefined,month,day:+m[1]} : null
}
function iso(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || year < 1000 || year > 9998 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const value = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(+date) && date.toISOString().slice(0,10) === value ? value : null
}

/** One-off closing-date reminders only. Dated past rounds never become future rounds.
 * An unsourced year is not guessed: the user can explicitly assign one in the preview.
 * Only fields explicitly marked recurring can resolve their next annual occurrence.
 */
export function planProgramCalendar(entries: CalendarProgram[], options: {now?: Date; undatedYear?: number} = {}): CalendarPlan {
  const now = options.now ?? new Date(), today = todayInBerlin(now), year = +today.slice(0,4)
  const result: CalendarPlan = {events:[],skipped:[],programsWithDates:0,undatedCount:0}
  const seen = new Set<string>(), programIds = new Set<string>()
  for (const {program:p,school} of entries) {
    if (programIds.has(p.program_id)) continue
    programIds.add(p.program_id)
    const skip = (reason: string) => result.skipped.push({programId:p.program_id,name:`${p.name} · ${school.name}`,reason})
    if (['discontinued','not-matched'].includes(p.status?.status ?? '') || /phase-out|auslaufende/i.test(p.details?.programPageNotes ?? '')) {skip('No confirmed future intake for this record.');continue}
    const windows = Object.entries(p.applicationDeadlines ?? {}).flatMap(([semester,d]) => d?.end ? [{...d,kind:'application',semester,scope:undefined as string | undefined,recurring:false,source:p.sources?.[`applicationDeadlines.${semester}`]}] : [])
    const others = (p.otherDeadlines ?? []).map(d => ({...d,source:d.source ?? p.sources?.otherDeadlines}))
    const deadlines = [...windows,...others]
    if (!deadlines.length) {skip('No documented closing dates.');continue}
    for (const d of deadlines) {
      const parts = d.end && dateParts(d.end)
      if (!parts) {skip('Closing date cannot be parsed; check the source.');continue}
      let resolvedYear = parts.year, assumedYear = false
      if (!resolvedYear && d.recurring === true) {
        resolvedYear = year
        const candidate = iso(resolvedYear,parts.month,parts.day)
        if (candidate && candidate < today) resolvedYear++
      } else if (!resolvedYear) {
        result.undatedCount++
        if (options.undatedYear == null) {skip(`No published year: ${d.end}.`);continue}
        resolvedYear = options.undatedYear; assumedYear = true
      }
      const date = iso(resolvedYear,parts.month,parts.day)
      if (!date) {skip(`Invalid calendar date: ${d.end}.`);continue}
      if (date < today) {skip(`Published / assigned round has passed: ${date}. Not moved to another year.`);continue}
      const uid = calendarUid(JSON.stringify([p.program_id,d.kind,d.semester ?? '',d.scope ?? '',date]))
      if (seen.has(uid)) continue
      seen.add(uid)
      const source = typeof d.source === 'string' && /^https?:\/\//i.test(d.source) ? d.source : p.details?.applicationUrl ?? p.details?.programUrl ?? school.website
      const kind = KINDS[d.kind] ?? d.kind
      const notes = [`${p.name}${p.degree?' ('+p.degree+')':''} at ${school.name}.`, `${kind}: ${date}${d.semester?' · '+d.semester+' intake':''}.`, d.start?`Published opening date: ${d.start}.`:'Opening date not documented.', d.scope?`Applies to: ${d.scope}.`:'Applicant scope not documented; confirm whether this applies to you.', assumedYear?`The user assigned ${resolvedYear} to a date published without a year. This is NOT a confirmed future round.`:d.recurring?'One occurrence of an explicitly recorded recurring deadline; no recurring calendar rule.':'Published dated round; no automatic recurrence.', 'All-day reminder, not an asserted cutoff time. Check the official instructions; dates can change. This downloaded file does not update itself.', source?`Source: ${source}`:'No official link documented.'].join('\n')
      result.events.push({uid,date,summary:`${kind} — ${p.name}${p.degree?' ('+p.degree+')':''} · ${school.name}${d.scope?' · '+d.scope:''}`,description:notes,url:source,programId:p.program_id,programName:p.name,schoolName:school.name,kind,scope:d.scope,assumedYear})
    }
  }
  result.events.sort((a,b) => a.date.localeCompare(b.date) || a.summary.localeCompare(b.summary))
  result.programsWithDates = new Set(result.events.map(e => e.programId)).size
  return result
}
export function programCalendarFile(plan: CalendarPlan, now = new Date()): string {
  return serializeCalendar(plan.events,now)
}
