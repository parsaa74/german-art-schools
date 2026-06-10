/**
 * Zod schemas. These drive both request validation and the auto-generated
 * OpenAPI spec (/openapi.json).
 *
 * Versioning stance: /v1 is ADDITIVE-ONLY — never remove or retype a field
 * in a response schema; only add optional/new fields.
 */
import { z } from '@hono/zod-openapi';

// ---------- error ----------

export const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: 'not_found' }),
      message: z.string().openapi({ example: 'school not found' }),
    }),
  })
  .openapi('Error');

// ---------- meta ----------

export const MetaSchema = z
  .object({
    snapshot_date: z.string(),
    generated_at: z.string(),
    counts: z.record(z.string(), z.number()),
    data_hash: z.string(),
    embedding_model: z.string(),
    license: z.string(),
    api_version: z.literal('v1'),
  })
  .openapi('Meta');

// ---------- schools ----------

export const SchoolSchema = z
  .object({
    id: z.string().openapi({ example: 'hochschule-fur-bildende-kunste-hamburg' }),
    name: z.string(),
    city: z.string(),
    state: z.string(),
    type: z.string().openapi({ example: 'kunsthochschule' }),
    coordinates: z.object({ lat: z.number(), lng: z.number() }),
    stats: z.object({
      students: z.number().nullable(),
      student_staff_ratio: z.number().nullable(),
      founded: z.number().nullable(),
    }),
    program_ids: z.array(z.string()),
  })
  .openapi('School');

export const SchoolsQuerySchema = z.object({
  state: z.string().optional().openapi({ example: 'Hamburg' }),
  city: z.string().optional().openapi({ example: 'Berlin' }),
  type: z.string().optional().openapi({ example: 'kunsthochschule' }),
});

// ---------- programs ----------

export const DegreeLevelSchema = z.enum([
  'bachelor',
  'master',
  'diploma',
  'phd',
  'other',
]);

export const DeadlineWindowSchema = z
  .object({
    semester: z.string(),
    start: z.object({ month: z.number(), day: z.number() }).nullable(),
    end: z.object({ month: z.number(), day: z.number() }).nullable(),
  })
  .openapi('DeadlineWindow');

export const ProgramSchema = z
  .object({
    program_id: z.string(),
    school_id: z.string(),
    school_name: z.string(),
    name: z.string(),
    degree: z.string().nullable(),
    degree_level: DegreeLevelSchema,
    language: z.string().nullable(),
    duration: z.string().nullable(),
    description: z.string().nullable(),
    specializations: z.array(z.string()),
    portfolio_required: z.boolean().nullable(),
    tuition_eur_per_semester: z.number().nullable(),
    application_url: z.string().nullable(),
    program_url: z.string().nullable(),
    source_url: z.string().nullable(),
    extracted_at: z.string().nullable(),
    deadlines: z.array(DeadlineWindowSchema),
    deadlines_raw: z.unknown(),
  })
  .openapi('Program');

export const ProgramSummarySchema = z
  .object({
    program_id: z.string(),
    name: z.string(),
    degree: z.string().nullable(),
    degree_level: DegreeLevelSchema,
    school_id: z.string(),
    school_name: z.string(),
  })
  .openapi('ProgramSummary');

/** Strict YYYY-MM-DD with a real month/day (year is ignored — windows are year-agnostic). */
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)')
  .refine((s) => {
    const month = Number(s.slice(5, 7));
    const day = Number(s.slice(8, 10));
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
  }, 'must be a valid calendar date');

export const ProgramsQuerySchema = z.object({
  degree_level: DegreeLevelSchema.optional(),
  language: z.string().optional().openapi({
    description: 'Case-insensitive substring match (values look like "German/English").',
    example: 'english',
  }),
  school: z.string().optional().openapi({ description: 'Exact school_id.' }),
  portfolio_required: z
    .enum(['true', 'false'])
    .optional()
    .openapi({ description: 'Boolean filter.' }),
  state: z.string().optional().openapi({ description: "Filter via the program's school state." }),
  q: z.string().optional().openapi({
    description:
      'Case-insensitive keyword search over name + description + specializations. All whitespace-separated tokens must match.',
  }),
  open_on: IsoDateSchema.optional().openapi({
    description:
      'ISO date (YYYY-MM-DD). Matches programs with ANY deadline window containing that month/day. Windows are year-agnostic and may wrap the year boundary (start > end). Windows with a null start (or null end) are never matched.',
    example: '2026-06-10',
  }),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const PaginatedProgramsSchema = z
  .object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    items: z.array(ProgramSchema),
  })
  .openapi('PaginatedPrograms');

export const SimilarQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(10),
  min_weight: z.coerce.number().min(-1).max(1).default(0),
});

export const SimilarResponseSchema = z
  .object({
    program_id: z.string(),
    similar: z.array(
      z.object({
        program: ProgramSummarySchema,
        weight: z.number(),
      }),
    ),
  })
  .openapi('SimilarPrograms');

// ---------- graph ----------

export const GraphSchema = z
  .object({
    node_count: z.number(),
    edge_count: z.number(),
    edges: z.array(
      z.object({ src: z.string(), dst: z.string(), weight: z.number() }),
    ),
  })
  .openapi('Graph');

export const IdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
});
