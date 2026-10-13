import assert from 'node:assert/strict'
import {planProgramCalendar,programCalendarFile,type CalendarProgram} from '../src/utils/programCalendar'
import {escapeCalendarText,foldCalendarLine,serializeCalendar} from '../src/utils/calendarCore'

const now = new Date('2026-10-11T12:00:00Z')
const fixture: CalendarProgram = {school:{id:'s',name:'Test school',website:'https://example.edu'},program:{program_id:'s--film--ma',name:'Film; Kunst, Gestaltung 🎬',degree:'Master of Arts',applicationDeadlines:{winter:{start:'1 December 2026',end:'18 January 2027'}},details:{programUrl:'https://example.edu/study/film'}}}
const plan = (entry: CalendarProgram, undatedYear?: number) => planProgramCalendar([entry],{now,undatedYear})
assert.equal(plan(fixture).events[0].date,'2027-01-18')
const ics = programCalendarFile(plan(fixture),now)
assert(ics.includes('DTSTART;VALUE=DATE:20270118\r\nDTEND;VALUE=DATE:20270119'))
assert(!ics.includes('VALARM') && !ics.includes('RRULE'))
assert.equal(planProgramCalendar([fixture,fixture],{now}).events.length,1,'Duplicate kept entries deduplicated')
assert.equal(plan(fixture).events[0].uid,planProgramCalendar([fixture],{now:new Date('2026-10-12T12:00:00Z')}).events[0].uid,'Stable UID across exports')
assert.notEqual(plan(fixture).events[0].uid,plan({...fixture,program:{...fixture.program,program_id:'s--film--ba'}}).events[0].uid,'Degree variants have separate immutable IDs')
const datedPast = {...fixture,program:{...fixture.program,applicationDeadlines:{winter:{end:'18 January 2026'}}}}
assert.equal(plan(datedPast).events.length,0,'Passed dated round never shifted')
const undated = {...fixture,program:{...fixture.program,applicationDeadlines:{winter:{end:'18 January'}}}}
assert.equal(plan(undated).events.length,0,'No implicit year assignment')
assert.equal(plan(undated).undatedCount,1)
assert.equal(plan(undated,2027).events[0].date,'2027-01-18')
assert(plan(undated,2027).events[0].description.includes('NOT a confirmed future round'))
assert.equal(plan(undated,2026).events.length,0,'Explicit assigned year is not moved forward')
const other = {...fixture,program:{...fixture.program,applicationDeadlines:{},otherDeadlines:[{kind:'portfolio',end:'03-15',recurring:true,scope:'foreign degree holders',source:'https://example.edu/portfolio'}]}}
assert.equal(plan(other).events[0].date,'2027-03-15')
assert(plan(other).events[0].summary.includes('foreign degree holders'))
assert.equal(plan(other).events[0].url,'https://example.edu/portfolio')
assert.equal(plan({...fixture,program:{...fixture.program,applicationDeadlines:{winter:{end:'31 February 2027'}}}}).events.length,0,'Invalid dates rejected')
assert.equal(plan({...fixture,program:{...fixture.program,applicationDeadlines:{winter:{end:'2027-12-31'}}}}).events[0].date,'2027-12-31')
assert.equal(plan({...fixture,program:{...fixture.program,details:{programPageNotes:'A phase-out program.'}}}).events.length,0)
assert.equal(plan({...fixture,program:{...fixture.program,status:{status:'discontinued'}}}).events.length,0)
assert.equal(plan({...fixture,program:{...fixture.program,applicationDeadlines:undefined}}).skipped[0].reason,'No documented closing dates.')
const sameDay = {...fixture,program:{...fixture.program,applicationDeadlines:{winter:{end:'11 October 2026'}}}}
assert.equal(plan(sameDay).events.length,1,'Current closing day is not already past at noon')
// Berlin is already on 12 October while UTC is still on 11 October.
assert.equal(planProgramCalendar([sameDay],{now:new Date('2026-10-11T22:30:00Z')}).events.length,0)
const long = 'SUMMARY:'+'Künste 🎬 中文; '.repeat(30)
const folded = foldCalendarLine(long)
for (const line of folded.split('\r\n')) assert(new TextEncoder().encode(line).length <= 75,'75 octets, not characters')
assert.equal(folded.replace(/\r\n /g,''),long,'UTF-8 preserved on unfolding')
assert.equal(escapeCalendarText('a\\b; c,d\r\nBEGIN:VEVENT'),'a\\\\b\\; c\\,d\\nBEGIN:VEVENT')
const injection = serializeCalendar([{uid:'safe',date:'2027-01-01',summary:'Name\nBEGIN:VEVENT',description:'Text',url:'https://example.edu/\r\nBEGIN:VEVENT'}],now)
assert.equal(injection.match(/^BEGIN:VEVENT\r?$/gm)?.length,1)
assert(!injection.includes('\r\nURL:'))
assert.throws(()=>serializeCalendar([{uid:'bad',date:'2027-02-31',summary:'bad',description:''}],now))
console.log('PASS: published / assigned / recurring years, past cycles, scopes, invalid dates, stable IDs, all-day end dates, UTF-8 folding, escaping and no added alarms.')
