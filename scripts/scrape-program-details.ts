import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const DATA_PATH = resolve(process.cwd(), 'src/data/enhanced_german_art_schools.json');
const MODEL = 'claude-opus-4-7';
const MAX_HTML_CHARS = 40_000;
const FETCH_TIMEOUT_MS = 15_000;
const CONCURRENCY = 1;
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

interface FacultyMember {
  name: string;
  title?: string | null;
  role?: string | null;
  profileUrl?: string | null;
  specializations?: string[];
}

interface ProgramDetails {
  programUrl?: string | null;
  applicationUrl?: string | null;
  faculty?: FacultyMember[];
  tuitionEuroPerSemester?: number | null;
  capacity?: number | null;
  studentsEnrolled?: number | null;
  languageRequirements?: string | null;
  portfolioRequired?: boolean | null;
  extractedAt?: string;
  sourceUrl?: string;
}

interface RawProgram {
  program_id: string;
  name: string;
  degree: string;
  details?: ProgramDetails;
  [k: string]: unknown;
}

interface RawSchool {
  id?: string;
  website?: string;
  programs?: RawProgram[];
  [k: string]: unknown;
}

interface RawData {
  universities: Record<string, RawSchool>;
  [k: string]: unknown;
}

const extractionTool = {
  name: 'submit_program_details',
  description:
    'Submit extracted program metadata. Only include a program entry if you found useful data for it. Prefer null over guessing.',
  input_schema: {
    type: 'object',
    properties: {
      programs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            program_id: { type: 'string', description: 'Exact program_id from the input list' },
            programUrl: { type: ['string', 'null'] },
            applicationUrl: { type: ['string', 'null'] },
            faculty: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  title: { type: ['string', 'null'] },
                  role: { type: ['string', 'null'] },
                  profileUrl: { type: ['string', 'null'] },
                  specializations: { type: 'array', items: { type: 'string' } },
                },
                required: ['name'],
              },
            },
            tuitionEuroPerSemester: { type: ['number', 'null'] },
            capacity: { type: ['number', 'null'] },
            studentsEnrolled: { type: ['number', 'null'] },
            languageRequirements: { type: ['string', 'null'] },
            portfolioRequired: { type: ['boolean', 'null'] },
          },
          required: ['program_id'],
        },
      },
    },
    required: ['programs'],
  },
} as const;

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_HTML_CHARS);
}

async function extractForSchool(
  client: Anthropic,
  schoolName: string,
  school: RawSchool,
  programs: RawProgram[],
): Promise<Array<{ program_id: string; details: ProgramDetails }>> {
  if (!school.website) return [];
  const html = await fetchHtml(school.website);
  if (!html) return [];
  const clean = cleanHtml(html);
  const programList = programs.map(p => `- ${p.program_id}: ${p.name} (${p.degree})`).join('\n');
  const prompt = `School: ${schoolName}
Website: ${school.website}

Programs to enrich:
${programList}

HTML content (may be truncated):
---
${clean}
---

Extract program-specific metadata. For each program, provide what you can find on this page:
- programUrl: direct URL to the program's own page
- applicationUrl: link to application instructions
- faculty: teachers/professors listed for this specific program (name required, others optional)
- tuitionEuroPerSemester: semester fee in euros (null if free or not listed — many German art schools are free)
- capacity: spots per intake (null if unknown)
- studentsEnrolled: current enrollment (null if unknown)
- languageRequirements: e.g. "DSH-2", "IELTS 6.5" (null if unknown)
- portfolioRequired: boolean (null if unclear)

Use null for missing fields — do not guess. Resolve relative URLs against ${school.website}. You MUST submit results by calling the submit_program_details tool exactly once, even if you found data for only some programs or none.`;

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16_000,
    thinking: { type: 'adaptive' },
    tools: [extractionTool as unknown as Anthropic.Tool],
    tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: prompt }],
  });
  const msg = await stream.finalMessage();
  const toolBlock = msg.content.find(b => b.type === 'tool_use') as
    | { type: 'tool_use'; input: { programs?: Array<Record<string, unknown>> } }
    | undefined;
  const list = toolBlock?.input?.programs ?? [];
  const now = new Date().toISOString();
  return list.map(p => ({
    program_id: String(p.program_id),
    details: {
      programUrl: (p.programUrl as string | null | undefined) ?? null,
      applicationUrl: (p.applicationUrl as string | null | undefined) ?? null,
      faculty: (p.faculty as FacultyMember[] | undefined) ?? [],
      tuitionEuroPerSemester: (p.tuitionEuroPerSemester as number | null | undefined) ?? null,
      capacity: (p.capacity as number | null | undefined) ?? null,
      studentsEnrolled: (p.studentsEnrolled as number | null | undefined) ?? null,
      languageRequirements: (p.languageRequirements as string | null | undefined) ?? null,
      portfolioRequired: (p.portfolioRequired as boolean | null | undefined) ?? null,
      extractedAt: now,
      sourceUrl: school.website,
    },
  }));
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY');
    process.exit(1);
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 8 });
  const raw = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as RawData;

  const entries = Object.entries(raw.universities);
  const queue = entries.slice();
  let done = 0;
  let enriched = 0;
  let errored = 0;
  let skipped = 0;

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      const [schoolName, school] = item;
      const progs = (school.programs ?? []).filter(p => !p.details?.extractedAt);
      if (!progs.length || !school.website) {
        skipped++;
        done++;
        console.log(`[${done}/${entries.length}] ${schoolName}: skipped`);
        continue;
      }
      try {
        const results = await extractForSchool(client, schoolName, school, progs);
        const byId = new Map(results.map(r => [r.program_id, r.details]));
        let n = 0;
        for (const prog of school.programs ?? []) {
          const d = byId.get(prog.program_id);
          if (d) {
            prog.details = d;
            n++;
            enriched++;
          }
        }
        done++;
        console.log(`[${done}/${entries.length}] ${schoolName}: ${n}/${progs.length} enriched`);
      } catch (err) {
        errored++;
        done++;
        console.warn(
          `[${done}/${entries.length}] ${schoolName} failed: ${(err as Error).message?.slice(0, 160)}`,
        );
      }
      if (done % 5 === 0) {
        writeFileSync(DATA_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  writeFileSync(DATA_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  console.log(`done: enriched=${enriched} errors=${errored} skipped=${skipped}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
