import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { GoogleGenAI } from '@google/genai';

const DATA_PATH = resolve(process.cwd(), 'src/data/enhanced_german_art_schools.json');
const OUT_PATH = resolve(process.cwd(), 'data/program_embeddings.json');
const MODEL = 'gemini-embedding-2-preview';
const DIM = 3072;
const TASK_TYPE = 'SEMANTIC_SIMILARITY';
const CONCURRENCY = 4;
const MAX_RETRIES = 5;

interface RawProgram {
  program_id: string;
  name: string;
  degree: string;
  language?: string;
  duration?: string;
  description?: string;
  specializations?: string[];
}

interface RawSchool {
  id?: string;
  type?: string;
  city?: string;
  state?: string;
  description?: string;
  programs?: RawProgram[];
}

interface RawData {
  universities: Record<string, RawSchool>;
}

function buildCorpus(schoolName: string, school: RawSchool, prog: RawProgram): string {
  const parts: string[] = [];
  parts.push(`School: ${schoolName}`);
  if (school.type) parts.push(`School type: ${school.type}`);
  if (school.city || school.state) parts.push(`Location: ${[school.city, school.state].filter(Boolean).join(', ')}`);
  parts.push(`Program: ${prog.name}`);
  parts.push(`Degree: ${prog.degree || 'unspecified'}`);
  if (prog.language) parts.push(`Language: ${prog.language}`);
  if (prog.duration) parts.push(`Duration: ${prog.duration}`);
  if (prog.description) parts.push(`Description: ${prog.description}`);
  if (prog.specializations?.length) parts.push(`Specializations: ${prog.specializations.join(', ')}`);
  if (school.description) parts.push(`School overview: ${school.description}`);
  return parts.join('\n');
}

async function embedOne(ai: GoogleGenAI, text: string): Promise<number[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await ai.models.embedContent({
        model: MODEL,
        contents: text,
        config: { taskType: TASK_TYPE, outputDimensionality: DIM },
      });
      const embeddings = (res as { embeddings?: Array<{ values: number[] }> }).embeddings;
      const single = (res as { embedding?: { values: number[] } }).embedding;
      const values = embeddings?.[0]?.values ?? single?.values;
      if (!values || !Array.isArray(values)) throw new Error(`unexpected response shape: ${JSON.stringify(res).slice(0, 200)}`);
      return values;
    } catch (err) {
      lastErr = err;
      const delay = Math.min(30_000, 1000 * 2 ** attempt) + Math.random() * 500;
      console.warn(`[retry ${attempt + 1}/${MAX_RETRIES}] ${(err as Error).message?.slice(0, 120)} — waiting ${Math.round(delay)}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error('embed failed');
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY');
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const raw = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as RawData;

  const existing: Record<string, number[]> = existsSync(OUT_PATH)
    ? (JSON.parse(readFileSync(OUT_PATH, 'utf8')) as { embeddings: Record<string, number[]> }).embeddings
    : {};

  const jobs: Array<{ id: string; text: string }> = [];
  for (const [schoolName, school] of Object.entries(raw.universities)) {
    for (const prog of school.programs ?? []) {
      if (!prog.program_id) continue;
      if (existing[prog.program_id]?.length === DIM) continue;
      jobs.push({ id: prog.program_id, text: buildCorpus(schoolName, school, prog) });
    }
  }

  console.log(`${jobs.length} programs to embed (${Object.keys(existing).length} cached, ${DIM}-dim ${MODEL})`);
  if (!jobs.length) {
    console.log('nothing to do');
    return;
  }

  const out: Record<string, number[]> = { ...existing };
  let done = 0;
  const queue = jobs.slice();

  async function worker() {
    while (queue.length) {
      const job = queue.shift();
      if (!job) break;
      const vec = await embedOne(ai, job.text);
      out[job.id] = vec;
      done++;
      if (done % 10 === 0 || done === jobs.length) {
        console.log(`  ${done}/${jobs.length}`);
        mkdirSync(dirname(OUT_PATH), { recursive: true });
        writeFileSync(
          OUT_PATH,
          JSON.stringify({ model: MODEL, dim: DIM, taskType: TASK_TYPE, createdAt: new Date().toISOString(), embeddings: out }),
          'utf8',
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(
    OUT_PATH,
    JSON.stringify({ model: MODEL, dim: DIM, taskType: TASK_TYPE, createdAt: new Date().toISOString(), embeddings: out }),
    'utf8',
  );
  console.log(`wrote ${Object.keys(out).length} embeddings -> ${OUT_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
