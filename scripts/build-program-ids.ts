import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DATA_PATH = resolve(process.cwd(), 'src/data/enhanced_german_art_schools.json');
const INDEX_OUT = resolve(process.cwd(), 'src/data/programs_index.json');

function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

interface RawProgram {
  name: string;
  degree: string;
  [k: string]: unknown;
  program_id?: string;
}

interface RawSchool {
  id?: string;
  programs?: RawProgram[];
  [k: string]: unknown;
}

interface RawData {
  statistics?: Record<string, unknown>;
  universities: Record<string, RawSchool>;
}

const raw = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as RawData;

const flat: Array<{
  program_id: string;
  schoolId: string;
  schoolName: string;
  name: string;
  degree: string;
}> = [];

let assigned = 0;
let reused = 0;

for (const [schoolName, school] of Object.entries(raw.universities)) {
  if (!school.id) school.id = slugify(schoolName);
  const seen = new Map<string, number>();
  for (const prog of school.programs ?? []) {
    const nameSlug = slugify(prog.name) || 'unnamed';
    const degreeSlug = slugify(prog.degree) || 'unspecified';
    const base = `${school.id}--${nameSlug}--${degreeSlug}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}--${count + 1}`;
    if (prog.program_id === id) reused++;
    else {
      prog.program_id = id;
      assigned++;
    }
    flat.push({
      program_id: id,
      schoolId: school.id,
      schoolName,
      name: prog.name,
      degree: prog.degree,
    });
  }
}

writeFileSync(DATA_PATH, JSON.stringify(raw, null, 2) + '\n', 'utf8');
writeFileSync(
  INDEX_OUT,
  JSON.stringify({ createdAt: new Date().toISOString(), count: flat.length, programs: flat }, null, 2) + '\n',
  'utf8',
);

console.log(`assigned=${assigned} reused=${reused} total=${flat.length}`);
console.log(`wrote ${DATA_PATH}`);
console.log(`wrote ${INDEX_OUT}`);
