import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SCHOOLS_PATH = resolve(process.cwd(), 'src/data/enhanced_german_art_schools.json');
const GRAPH_PATH = resolve(process.cwd(), 'src/data/program_graph.json');
const EMB_PATH = resolve(process.cwd(), 'data/program_embeddings.json');
const OUT_DIR = resolve(process.cwd(), 'api/data');

const SCALE = 127;

// ---------- input shapes ----------

interface RawDeadlineWindow {
  start?: string | null;
  end?: string | null;
}

interface RawProgram {
  name?: string;
  degree?: string;
  applicationDeadlines?: Record<string, RawDeadlineWindow | string | null> | null;
  language?: string | null;
  duration?: string | null;
  description?: string | null;
  specializations?: string[] | null;
  program_id?: string;
  details?: {
    programUrl?: string | null;
    applicationUrl?: string | null;
    tuitionEuroPerSemester?: number | null;
    portfolioRequired?: boolean | null;
    extractedAt?: string | null;
    sourceUrl?: string | null;
  } | null;
}

interface RawSchool {
  id?: string;
  coordinates?: { lat: number; lng: number };
  stats?: {
    students?: number;
    student_staff_ratio?: number;
    founded?: number;
  };
  city?: string;
  state?: string;
  type?: string;
  programs?: RawProgram[];
}

interface RawData {
  statistics?: { last_updated?: string };
  universities: Record<string, RawSchool>;
}

interface GraphFile {
  model: string;
  edges: Array<{ src: string; dst: string; weight: number }>;
}

interface EmbeddingsFile {
  model: string;
  dim: number;
  embeddings: Record<string, number[]>;
}

// ---------- output shapes ----------

interface MonthDay {
  month: number;
  day: number;
}

interface Deadline {
  semester: string;
  start: MonthDay | null;
  end: MonthDay | null;
}

interface OutProgram {
  program_id: string;
  school_id: string;
  school_name: string;
  name: string;
  degree: string;
  degree_level: 'bachelor' | 'master' | 'diploma' | 'phd' | 'other';
  language: string | null;
  duration: string | null;
  description: string | null;
  specializations: string[];
  portfolio_required: boolean | null;
  tuition_eur_per_semester: number | null;
  application_url: string | null;
  program_url: string | null;
  source_url: string | null;
  extracted_at: string | null;
  deadlines: Deadline[];
  deadlines_raw: Record<string, RawDeadlineWindow | string | null> | null;
}

interface OutSchool {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  type: string | null;
  coordinates: { lat: number; lng: number } | null;
  stats: {
    students: number | null;
    student_staff_ratio: number | null;
    founded: number | null;
  };
  program_ids: string[];
}

// ---------- deadline parsing ----------

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  // German month names (defensive — handled if present)
  januar: 1, februar: 2, marz: 3, mai: 5, juni: 6,
  juli: 7, oktober: 10, dezember: 12,
};

const FUZZY_DAY: Record<string, number> = { early: 5, mid: 15, late: 25 };

function normalizeMonthWord(word: string): string {
  return word
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parseDeadlineString(raw: string): MonthDay | null {
  const s = raw.trim();
  // "1 March" / "15. März"
  let m = s.match(/^(\d{1,2})\.?\s+([A-Za-zÄÖÜäöüß]+)$/);
  if (m) {
    const day = Number(m[1]);
    const month = MONTHS[normalizeMonthWord(m[2])];
    if (month && day >= 1 && day <= 31) return { month, day };
    return null;
  }
  // "early March" / "mid March" / "late March"
  m = s.match(/^(early|mid|late)[\s-]+([A-Za-zÄÖÜäöüß]+)$/i);
  if (m) {
    const day = FUZZY_DAY[m[1].toLowerCase()];
    const month = MONTHS[normalizeMonthWord(m[2])];
    if (month && day) return { month, day };
    return null;
  }
  return null;
}

// ---------- degree level ----------

function deriveDegreeLevel(degree: string): OutProgram['degree_level'] {
  const d = degree
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/\bphd\b|dr\.\s*phil/.test(d)) return 'phd';
  const isBachelor = /\bbachelor\b/.test(d);
  const isMaster = /\bmaster\b/.test(d);
  if (isBachelor && isMaster) return 'other'; // e.g. "Bachelor/Master"
  if (isBachelor) return 'bachelor';
  if (isMaster) return 'master';
  if (/meister/.test(d)) return 'other'; // Meisterschüler etc., not a Diplom degree
  if (/diplom/.test(d)) return 'diploma';
  return 'other';
}

// ---------- helpers ----------

function writeJson(path: string, value: unknown): string {
  const json = JSON.stringify(value, null, 2) + '\n';
  writeFileSync(path, json, 'utf8');
  return json;
}

function fail(msg: string): never {
  console.error(`ASSERTION FAILED: ${msg}`);
  process.exit(1);
}

function int8Cosine(a: Int8Array, b: Int8Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

// ---------- main ----------

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  // load previous meta/programs for the diff report before overwriting
  const prevMetaPath = resolve(OUT_DIR, 'meta.json');
  const prevProgramsPath = resolve(OUT_DIR, 'programs.json');
  let prevMeta: { counts?: Record<string, number> } | null = null;
  let prevProgramIds: Set<string> | null = null;
  if (existsSync(prevMetaPath)) {
    prevMeta = JSON.parse(readFileSync(prevMetaPath, 'utf8'));
    if (existsSync(prevProgramsPath)) {
      prevProgramIds = new Set(Object.keys(JSON.parse(readFileSync(prevProgramsPath, 'utf8'))));
    }
  }

  const raw = JSON.parse(readFileSync(SCHOOLS_PATH, 'utf8')) as RawData;
  const graphFile = JSON.parse(readFileSync(GRAPH_PATH, 'utf8')) as GraphFile;
  console.log('loading embeddings (29MB)...');
  const embFile = JSON.parse(readFileSync(EMB_PATH, 'utf8')) as EmbeddingsFile;

  // ----- schools.json + programs.json -----
  const schools: Record<string, OutSchool> = {};
  const programs: Record<string, OutProgram> = {};
  const deadlineReport = {
    total: 0,
    parsed: 0,
    unparseable: [] as Array<{ program_id: string; semester: string; raw: string }>,
  };

  for (const [schoolName, school] of Object.entries(raw.universities)) {
    if (!school.id) {
      console.warn(`warning: school "${schoolName}" has no id, skipping`);
      continue;
    }
    const programIds: string[] = [];

    for (const prog of school.programs ?? []) {
      if (!prog.program_id) {
        console.warn(`warning: program "${prog.name}" at ${school.id} has no program_id, skipping`);
        continue;
      }

      const deadlines: Deadline[] = [];
      const rawDeadlines = prog.applicationDeadlines ?? null;
      if (rawDeadlines && typeof rawDeadlines === 'object') {
        for (const [semester, window] of Object.entries(rawDeadlines)) {
          if (window == null) continue;
          if (typeof window === 'string') {
            // unexpected shape: bare string instead of {start, end} — record as unparseable end
            deadlineReport.total++;
            const parsed = parseDeadlineString(window);
            if (parsed) deadlineReport.parsed++;
            else deadlineReport.unparseable.push({ program_id: prog.program_id, semester, raw: window });
            deadlines.push({ semester, start: null, end: parsed });
            continue;
          }
          const entry: Deadline = { semester, start: null, end: null };
          for (const field of ['start', 'end'] as const) {
            const value = window[field];
            if (typeof value !== 'string' || value.trim() === '') continue;
            deadlineReport.total++;
            const parsed = parseDeadlineString(value);
            if (parsed) {
              deadlineReport.parsed++;
              entry[field] = parsed;
            } else {
              console.warn(`warning: unparseable deadline "${value}" (${prog.program_id} ${semester}.${field})`);
              deadlineReport.unparseable.push({ program_id: prog.program_id, semester, raw: value });
            }
          }
          deadlines.push(entry);
        }
      }

      const details = prog.details ?? null;
      programs[prog.program_id] = {
        program_id: prog.program_id,
        school_id: school.id,
        school_name: schoolName,
        name: prog.name ?? '',
        degree: prog.degree ?? '',
        degree_level: deriveDegreeLevel(prog.degree ?? ''),
        language: prog.language ?? null,
        duration: prog.duration ?? null,
        description: prog.description ?? null,
        specializations: prog.specializations ?? [],
        portfolio_required: details?.portfolioRequired ?? null,
        tuition_eur_per_semester: details?.tuitionEuroPerSemester ?? null,
        application_url: details?.applicationUrl ?? null,
        program_url: details?.programUrl ?? null,
        source_url: details?.sourceUrl ?? null,
        extracted_at: details?.extractedAt ?? null,
        deadlines,
        deadlines_raw: rawDeadlines,
      };
      programIds.push(prog.program_id);
    }

    // deliberately dropped: ranking, stats.acceptance_rate (shaky provenance)
    schools[school.id] = {
      id: school.id,
      name: schoolName,
      city: school.city ?? null,
      state: school.state ?? null,
      type: school.type ?? null,
      coordinates: school.coordinates ?? null,
      stats: {
        students: school.stats?.students ?? null,
        student_staff_ratio: school.stats?.student_staff_ratio ?? null,
        founded: school.stats?.founded ?? null,
      },
      program_ids: programIds,
    };
  }

  // ----- graph.json (symmetric adjacency lists) -----
  const adjacency: Record<string, Array<{ id: string; weight: number }>> = {};
  const seenPairs = new Set<string>();
  let droppedEdges = 0;
  const staleGraphIds = new Set<string>();
  for (const { src, dst, weight } of graphFile.edges) {
    if (!programs[src] || !programs[dst]) {
      droppedEdges++;
      if (!programs[src]) staleGraphIds.add(src);
      if (!programs[dst]) staleGraphIds.add(dst);
      continue;
    }
    const key = src < dst ? `${src}|${dst}` : `${dst}|${src}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    (adjacency[src] ??= []).push({ id: dst, weight });
    (adjacency[dst] ??= []).push({ id: src, weight });
  }
  for (const list of Object.values(adjacency)) list.sort((a, b) => b.weight - a.weight);
  if (droppedEdges > 0) {
    console.warn(
      `warning: dropped ${droppedEdges} graph edges touching ${staleGraphIds.size} ids with no matching program:`,
    );
    for (const id of staleGraphIds) console.warn(`  - ${id}`);
  }

  // ----- vectors.bin + vectors.meta.json -----
  const vectorIds = Object.keys(embFile.embeddings)
    .filter(id => {
      if (programs[id]) return true;
      console.warn(`warning: dropping embedding for "${id}" (no matching program)`);
      return false;
    })
    .sort();
  const dim = embFile.dim;
  const bin = new Int8Array(vectorIds.length * dim);
  const quantized = new Map<string, Int8Array>();
  for (let row = 0; row < vectorIds.length; row++) {
    const vec = embFile.embeddings[vectorIds[row]];
    if (vec.length !== dim) fail(`embedding ${vectorIds[row]} has dim ${vec.length}, expected ${dim}`);
    let norm = 0;
    for (const v of vec) norm += v * v;
    norm = Math.sqrt(norm) || 1;
    const out = bin.subarray(row * dim, (row + 1) * dim);
    for (let i = 0; i < dim; i++) {
      out[i] = Math.max(-SCALE, Math.min(SCALE, Math.round((vec[i] / norm) * SCALE)));
    }
    quantized.set(vectorIds[row], out);
  }
  const programsWithoutVectors = Object.keys(programs).filter(id => !embFile.embeddings[id]);
  if (programsWithoutVectors.length > 0) {
    console.warn(`warning: ${programsWithoutVectors.length} programs have no embedding (kept in programs.json, absent from vectors)`);
  }

  // ----- spot-check: int8 cosine vs edge weights -----
  console.log('spot-checking int8 cosine against graph edge weights:');
  let checked = 0;
  for (const { src, dst, weight } of graphFile.edges) {
    if (checked >= 3) break;
    const a = quantized.get(src);
    const b = quantized.get(dst);
    if (!a || !b) continue;
    const cos = int8Cosine(a, b);
    const diff = Math.abs(cos - weight);
    console.log(`  ${src} <-> ${dst}: edge=${weight} int8=${cos.toFixed(4)} diff=${diff.toFixed(4)}`);
    if (diff > 0.02) fail(`int8 cosine deviates from edge weight by ${diff.toFixed(4)} (> 0.02)`);
    checked++;
  }
  if (checked < 3) fail('fewer than 3 edges available for spot-check');

  // ----- sanity assertions -----
  const schoolCount = Object.keys(schools).length;
  const programCount = Object.keys(programs).length;
  if (schoolCount !== 93) fail(`expected 93 schools, got ${schoolCount}`);
  if (programCount < 700) fail(`expected >= 700 programs, got ${programCount}`);
  for (const p of Object.values(programs)) {
    if (!schools[p.school_id]) fail(`program ${p.program_id} references unknown school ${p.school_id}`);
  }
  for (const [id, neighbors] of Object.entries(adjacency)) {
    if (!programs[id]) fail(`graph node ${id} not in programs.json`);
    for (const n of neighbors) {
      if (!programs[n.id]) fail(`graph neighbor ${n.id} (of ${id}) not in programs.json`);
    }
  }
  if (bin.byteLength !== vectorIds.length * dim) {
    fail(`vectors.bin byte length ${bin.byteLength} != count * dim ${vectorIds.length * dim}`);
  }

  // ----- write artifacts -----
  const schoolsJson = writeJson(resolve(OUT_DIR, 'schools.json'), schools);
  const programsJson = writeJson(resolve(OUT_DIR, 'programs.json'), programs);
  const graphJson = writeJson(resolve(OUT_DIR, 'graph.json'), adjacency);
  writeJson(resolve(OUT_DIR, 'deadline-report.json'), deadlineReport);
  writeFileSync(resolve(OUT_DIR, 'vectors.bin'), Buffer.from(bin.buffer, bin.byteOffset, bin.byteLength));
  writeJson(resolve(OUT_DIR, 'vectors.meta.json'), {
    model: embFile.model,
    dim,
    count: vectorIds.length,
    scale: SCALE,
    ids: vectorIds,
  });

  const edgeCount = seenPairs.size;
  const dataHash = createHash('sha256')
    .update(schoolsJson)
    .update(programsJson)
    .update(graphJson)
    .digest('hex')
    .slice(0, 12);
  writeJson(resolve(OUT_DIR, 'meta.json'), {
    snapshot_date: raw.statistics?.last_updated ?? null,
    generated_at: new Date().toISOString(),
    counts: {
      schools: schoolCount,
      programs: programCount,
      edges: edgeCount,
      vectors: vectorIds.length,
    },
    data_hash: dataHash,
    embedding_model: embFile.model,
    license: 'TBD',
  });

  // ----- diff report -----
  console.log('---');
  if (prevMeta) {
    console.log('diff vs previous run:');
    const prevCounts = prevMeta.counts ?? {};
    for (const [key, value] of Object.entries({ schools: schoolCount, programs: programCount, edges: edgeCount, vectors: vectorIds.length })) {
      const prev = prevCounts[key];
      const delta = prev == null ? '?' : value - prev;
      console.log(`  ${key}: ${prev ?? '?'} -> ${value} (${typeof delta === 'number' && delta >= 0 ? '+' : ''}${delta})`);
    }
    if (prevProgramIds) {
      const added = Object.keys(programs).filter(id => !prevProgramIds.has(id));
      const removed = [...prevProgramIds].filter(id => !programs[id]);
      console.log(`  programs added (${added.length}):${added.length ? '' : ' none'}`);
      for (const id of added) console.log(`    + ${id}`);
      console.log(`  programs removed (${removed.length}):${removed.length ? '' : ' none'}`);
      for (const id of removed) console.log(`    - ${id}`);
    }
  } else {
    console.log('first run (no previous meta.json):');
    console.log(`  schools=${schoolCount} programs=${programCount} edges=${edgeCount} vectors=${vectorIds.length}`);
  }
  console.log('---');
  console.log(`deadlines: parsed ${deadlineReport.parsed}/${deadlineReport.total} (${deadlineReport.unparseable.length} unparseable)`);
  console.log(`data_hash: ${dataHash}`);
  console.log(`wrote artifacts -> ${OUT_DIR}`);
}

main();
