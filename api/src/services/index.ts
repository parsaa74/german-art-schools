/**
 * Service layer barrel. Pure functions over the bundled data artifacts —
 * no Hono imports anywhere below. The REST routes are thin wrappers over
 * these, and the MCP server (src/mcp/) calls them directly.
 */
export { listSchools, getSchool, type SchoolFilters } from './schools';
export {
  listPrograms,
  getProgram,
  similarPrograms,
  toProgramSummary,
  windowContains,
  type ProgramFilters,
  type Pagination,
  type MonthDay,
  type SimilarOptions,
  type SimilarResult,
} from './programs';
export { getGraph, type GraphSummary } from './graph';
export { getMeta, type MetaResponse } from './meta';
