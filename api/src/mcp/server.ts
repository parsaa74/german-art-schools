/**
 * MCP server factory: builds a McpServer exposing the german-art-schools
 * data as 6 read-only tools. Pure wiring over the service layer — no Hono
 * imports here; the transport lives in ./index.ts.
 *
 * Stateless usage: ./index.ts builds a fresh server per POST request and
 * closes over the Worker env (GEMINI_API_KEY for search_programs).
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  getMeta,
  getProgram,
  getSchool,
  listPrograms,
  listSchools,
  similarPrograms,
} from '../services';
import {
  SearchUnavailableError,
  semanticSearch,
  type SearchEnv,
} from '../services/search';
import type { DeadlineWindow, DegreeLevel } from '../types';

// ---------- result helpers ----------

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

function jsonResult(payload: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

function errorResult(message: string): ToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

// ---------- deadline formatting ----------

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMonthDay(md: { month: number; day: number }): string {
  return `${md.day} ${MONTHS[md.month - 1] ?? `month ${md.month}`}`;
}

/** "1 March – 15 April (winter)" — year-agnostic, human-readable. */
export function formatWindow(w: DeadlineWindow): string {
  let range: string;
  if (w.start !== null && w.end !== null) {
    range = `${formatMonthDay(w.start)} – ${formatMonthDay(w.end)}`;
  } else if (w.end !== null) {
    range = `until ${formatMonthDay(w.end)}`;
  } else if (w.start !== null) {
    range = `from ${formatMonthDay(w.start)}`;
  } else {
    range = 'dates unknown';
  }
  return w.semester ? `${range} (${w.semester})` : range;
}

// ---------- input schema fragments ----------

const DEGREE_LEVELS = ['bachelor', 'master', 'diploma', 'phd', 'other'] as const;

const degreeLevelSchema = z
  .enum(DEGREE_LEVELS)
  .describe('Exact degree level filter.');

const languageSchema = z
  .string()
  .min(1)
  .describe(
    'Case-insensitive substring match on the language of instruction, e.g. "english" matches "German/English".',
  );

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected an ISO date (YYYY-MM-DD)')
  .refine((s) => {
    const month = Number(s.slice(5, 7));
    const day = Number(s.slice(8, 10));
    return month >= 1 && month <= 12 && day >= 1 && day <= 31;
  }, 'impossible calendar date');

const SOURCE_NOTE =
  'Always relay application_url and note extracted_at so the user can verify deadlines at the source.';

// ---------- server factory ----------

export function buildMcpServer(env: SearchEnv): McpServer {
  const meta = getMeta();

  const server = new McpServer(
    { name: 'german-art-schools', version: meta.snapshot_date },
    {
      instructions:
        `Read-only data on German art schools: ${meta.counts.schools} schools and ` +
        `${meta.counts.programs} study programs (fine art, design, film, music, media, architecture) ` +
        `with degree level, language, tuition, application deadline windows, and a ` +
        `program-similarity graph. Data snapshot: ${meta.snapshot_date}. ` +
        `Deadline data is scraped from school websites and may be incomplete or stale: ` +
        `when discussing deadlines, always pass on the program's application_url and ` +
        `mention extracted_at so users can verify at the source.`,
    },
  );

  server.registerTool(
    'list_schools',
    {
      description:
        'List German art schools as compact summaries (id, name, city, state, type, program count). ' +
        'Optional case-insensitive exact filters: state, city, type. ' +
        'Use this to discover school ids, then get_school for full details.',
      inputSchema: {
        state: z.string().min(1).optional().describe('German state, e.g. "Hamburg", "Bayern".'),
        city: z.string().min(1).optional().describe('City, e.g. "Berlin".'),
        type: z.string().min(1).optional().describe('School type, e.g. "kunsthochschule".'),
      },
    },
    async ({ state, city, type }) => {
      const schools = listSchools({ state, city, type });
      return jsonResult({
        total: schools.length,
        schools: schools.map((s) => ({
          id: s.id,
          name: s.name,
          city: s.city,
          state: s.state,
          type: s.type,
          program_count: s.program_ids.length,
        })),
      });
    },
  );

  server.registerTool(
    'get_school',
    {
      description:
        'Get one school by id: full record (location, type, stats) plus all of its programs ' +
        'as summaries (program_id, name, degree, degree_level). Get ids from list_schools. ' +
        'Use get_program for a program\'s deadlines and application details.',
      inputSchema: {
        school_id: z.string().min(1).describe('School id, e.g. "hochschule-fur-bildende-kunste-hamburg".'),
      },
    },
    async ({ school_id }) => {
      const school = getSchool(school_id);
      if (school === null) {
        return errorResult(
          `Unknown school id: "${school_id}". Use list_schools to find valid ids.`,
        );
      }
      const programs = school.program_ids
        .map((pid) => getProgram(pid))
        .filter((p) => p !== null)
        .map((p) => ({
          program_id: p.program_id,
          name: p.name,
          degree: p.degree,
          degree_level: p.degree_level,
        }));
      return jsonResult({ ...school, programs });
    },
  );

  server.registerTool(
    'get_program',
    {
      description:
        'Get one program by id: full record incl. degree, language, duration, description, ' +
        'tuition, portfolio requirement, deadline windows, application_url, source_url, extracted_at. ' +
        SOURCE_NOTE,
      inputSchema: {
        program_id: z.string().min(1).describe('Program id from get_school, list_open_deadlines, or search results.'),
      },
    },
    async ({ program_id }) => {
      const program = getProgram(program_id);
      if (program === null) {
        return errorResult(
          `Unknown program id: "${program_id}". Use get_school or list_open_deadlines to find valid ids.`,
        );
      }
      return jsonResult({
        ...program,
        deadline_windows_readable: program.deadlines.map(formatWindow),
      });
    },
  );

  server.registerTool(
    'list_open_deadlines',
    {
      description:
        'Find programs whose application window contains a given date (default: today) — ' +
        'the go-to tool for "what can I still apply to?". Deadline windows are year-agnostic ' +
        'month/day ranges; windows with unknown bounds never match. ' +
        'Optional filters: degree_level, language, state. ' + SOURCE_NOTE,
      inputSchema: {
        on_date: isoDateSchema.optional().describe('ISO date (YYYY-MM-DD). Defaults to today.'),
        degree_level: degreeLevelSchema.optional(),
        language: languageSchema.optional(),
        state: z.string().min(1).optional().describe('Case-insensitive German state of the school, e.g. "Berlin".'),
        limit: z.number().int().min(1).max(200).optional().describe('Max programs to return (default 25).'),
      },
    },
    async ({ on_date, degree_level, language, state, limit }) => {
      const date = on_date ?? new Date().toISOString().slice(0, 10);
      const open_on = {
        month: Number(date.slice(5, 7)),
        day: Number(date.slice(8, 10)),
      };
      const page = listPrograms(
        {
          degree_level: degree_level as DegreeLevel | undefined,
          language,
          state,
          open_on,
        },
        { limit: limit ?? 25, offset: 0 },
      );
      return jsonResult({
        on_date: date,
        total_open: page.total,
        returned: page.items.length,
        programs: page.items.map((p) => {
          const school = getSchool(p.school_id);
          return {
            program_id: p.program_id,
            name: p.name,
            school_id: p.school_id,
            school_name: p.school_name,
            city: school?.city ?? null,
            state: school?.state ?? null,
            degree: p.degree,
            degree_level: p.degree_level,
            language: p.language,
            deadline_windows: p.deadlines.map(formatWindow),
            application_url: p.application_url,
            extracted_at: p.extracted_at,
          };
        }),
      });
    },
  );

  server.registerTool(
    'find_similar_programs',
    {
      description:
        'List the programs most similar to a given program (precomputed content-similarity ' +
        'graph, weights 0–1, sorted desc). Use to suggest alternatives once a user likes a program. ' +
        'Follow up with get_program for deadlines and application details.',
      inputSchema: {
        program_id: z.string().min(1).describe('Program id to find neighbors for.'),
        limit: z.number().int().min(1).max(50).optional().describe('Max neighbors (default 10).'),
      },
    },
    async ({ program_id, limit }) => {
      const result = similarPrograms(program_id, { limit: limit ?? 10 });
      if (result === null) {
        return errorResult(
          `Unknown program id: "${program_id}". Use get_school or list_open_deadlines to find valid ids.`,
        );
      }
      return jsonResult(result);
    },
  );

  server.registerTool(
    'search_programs',
    {
      description:
        'Semantic free-text search over program content — best for thematic queries like ' +
        '"experimental sound art" or "sustainable textile design". Returns programs with relevance ' +
        'scores. For structured filtering (deadlines, location, degree) prefer list_open_deadlines ' +
        'or list_schools. ' + SOURCE_NOTE,
      inputSchema: {
        query: z.string().min(1).describe('Natural-language query, German or English.'),
        degree_level: degreeLevelSchema.optional(),
        language: languageSchema.optional(),
        limit: z.number().int().min(1).max(50).optional().describe('Max hits (default 10).'),
      },
    },
    async ({ query, degree_level, language, limit }) => {
      try {
        const hits = await semanticSearch(
          query,
          { limit: limit ?? 10, degreeLevel: degree_level, language },
          env,
        );
        return jsonResult({
          query,
          results: hits.map((h) => ({ ...h.program, score: h.score })),
        });
      } catch (err) {
        if (err instanceof SearchUnavailableError) {
          return errorResult(
            'Semantic search is currently unavailable on this server. ' +
              'Use list_open_deadlines or get_school/list_schools with filters instead.',
          );
        }
        throw err;
      }
    },
  );

  return server;
}
