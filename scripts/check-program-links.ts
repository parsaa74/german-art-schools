import assert from 'node:assert/strict'
import { programLinks } from '../src/lib/programLinks'
import data from '../src/data/enhanced_german_art_schools.json'

const school = 'https://school.example/'
assert.deepEqual(programLinks(undefined, school), [{url: school, label: 'School website'}])
assert.deepEqual(programLinks({programUrl: 'https://www.school.example/en/'}, school), [{url: school, label: 'School website'}])
assert.deepEqual(programLinks({programUrl: 'https://school.example/', applicationUrl: 'https://school.example/apply'}, school).map(l => l.label), ['How to apply', 'School website'])
assert.deepEqual(programLinks({programUrl: 'https://school.example/application/'}, school).map(l => l.label), ['How to apply', 'School website'])
assert.deepEqual(programLinks({programUrl: 'https://school.example/study/film', applicationUrl: 'https://school.example/apply'}, school).map(l => l.label), ['Program page', 'How to apply'])
assert.deepEqual(programLinks({studyOverviewUrl: 'https://school.example/study/'}, school).map(l => l.label), ['Study information (program page not verified)', 'School website'])
assert.deepEqual(programLinks({programUrl: 'javascript:alert(1)', applicationUrl: 'not a URL'}, school), [{url: school, label: 'School website'}])
assert.deepEqual(programLinks({programUrl: 'https://school.example/apply', applicationUrl: 'https://school.example/apply'}, school).map(l => l.label), ['How to apply', 'School website'])
let preserved = 0
for (const u of Object.values(data.universities)) for (const p of u.programs) {
  const details = ('details' in p ? p.details : undefined) as {programUrl?: string; studyOverviewUrl?: string; applicationUrl?: string} | undefined
  if (!details?.studyOverviewUrl) continue
  const links = programLinks(details, u.website)
  const originalUrl = new URL(details.studyOverviewUrl!).href
  if (details.programUrl && new URL(details.programUrl).href === originalUrl) {
    assert(links.some(l => l.url === originalUrl && l.label === 'Program page'),'Later content review can confirm the preserved shared page')
    assert.equal(links.filter(l => l.url === originalUrl).length,1,'One destination, not contradictory duplicate labels')
  } else {
    assert(links.some(l => l.url === originalUrl && l.label === 'Study information (program page not verified)'))
    assert(!links.some(l => l.url === originalUrl && l.label === 'Program page'))
  }
  preserved++
}
console.log(`PASS: link categories, safe schemes, homepage/application fallbacks and ${preserved} preserved study-information URLs.`)
