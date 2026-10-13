type LinkDetails = {
  programUrl?: string
  studyOverviewUrl?: string
  applicationUrl?: string
}

export type OfficialProgramLink = {
  url: string
  label: 'Program page' | 'Study information (program page not verified)' | 'How to apply' | 'School website'
}

function webUrl(value?: string): URL | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return /^https?:$/.test(url.protocol) ? url : null
  } catch { return null }
}

function homepage(url: URL, school: URL | null): boolean {
  const host = (u: URL) => u.hostname.replace(/^www\./, '')
  const path = (u: URL) => u.pathname.replace(/\/+$/, '')
  return !!school && host(url) === host(school) && (
    path(url) === path(school) || /^(?:\/(?:en|de)(?:\/index\.(?:html?|php))?|\/index\.(?:html?|php))?$/.test(path(url))
  )
}

/** Keep program, unverified overview, application and school destinations distinct. */
export function programLinks(details: LinkDetails | undefined, schoolWebsite?: string): OfficialProgramLink[] {
  const links: OfficialProgramLink[] = []
  const school = webUrl(schoolWebsite)
  const program = webUrl(details?.programUrl)
  const overview = webUrl(details?.studyOverviewUrl)
  const application = webUrl(details?.applicationUrl)
  const isApplication = program && (
    program.href === application?.href || /\/(?:bewerbung|application|apply|admissions?|zulassung|faq)\/?$/i.test(program.pathname)
  )
  const specific = program && !homepage(program, school) && !isApplication
  if (specific) links.push({url: program.href, label: 'Program page'})
  if (overview && !homepage(overview, school)) links.push({url: overview.href, label: 'Study information (program page not verified)'})
  if (application) links.push({url: application.href, label: 'How to apply'})
  else if (isApplication && program) links.push({url: program.href, label: 'How to apply'})
  if (!specific && school) links.push({url: school.href, label: 'School website'})
  return links.filter((link, i) => links.findIndex(other => other.url === link.url) === i)
}
