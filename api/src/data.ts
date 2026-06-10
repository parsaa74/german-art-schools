/**
 * Single import point for the generated data artifacts in api/data/.
 * JSON is bundled directly into the Worker by wrangler/esbuild (and resolved
 * natively by vitest). Do not mutate these objects.
 *
 * vectors.bin is deliberately NOT imported here: it is only needed by the
 * semantic search module (src/routes/search.ts, owned by the search agent),
 * which should import it directly:  import vectorsBin from '../../data/vectors.bin'
 */
import schoolsJson from '../data/schools.json';
import programsJson from '../data/programs.json';
import graphJson from '../data/graph.json';
import metaJson from '../data/meta.json';
import type { Graph, Meta, Program, School } from './types';

export const schools = schoolsJson as unknown as Record<string, School>;
export const programs = programsJson as unknown as Record<string, Program>;
export const graph = graphJson as unknown as Graph;
export const meta = metaJson as unknown as Meta;
