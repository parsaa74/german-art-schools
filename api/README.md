# German Art Schools API

Read-only REST API and MCP server for the same catalogue as the website.

- REST: https://german-art-schools-api.parsaazari21.workers.dev/v1/meta
- OpenAPI: https://german-art-schools-api.parsaazari21.workers.dev/openapi.json
- MCP (Streamable HTTP): https://german-art-schools-api.parsaazari21.workers.dev/mcp

## Schools and programmes

```text
GET /v1/schools
GET /v1/schools/deutsche-film-und-fernsehakademie-berlin
GET /v1/schools/ifs-internationale-filmschule-koln
GET /v1/programs?school=ifs-internationale-filmschule-koln
GET /v1/programs?school=ifs-internationale-filmschule-koln&q=Production%20Design
```

The 2026-10-11 snapshot contains **95 schools / 790 programme records**. Counts include retained catalogue-warning and historical records; they do not mean every record is a verified currently open degree. Existing programme IDs remain unchanged. Map coordinates are approximate placements, not verified campus GPS.

DFFB has five full-time study routes ending in its own **non-state diploma**. These are classified as `degree_level: "other"`, not university Bachelor, Master or Diplom degrees. ifs has one Film B.A. with seven nested specialisations and four M.A. programmes. Language tracks and specialisations are not separate degrees.

## Additive application metadata

`/v1` retains its previous response keys and types. Programme records additionally expose optional fields:

- `application_methods`: sourced handling routes for applicants with non-German qualifications; `[]` means unresearched. Read `application_route.scope` and `notes` for exemptions and additional stages. Direct submission alone does not prove credential-validation fees are waived.
- `application_route`: method, notes, official URL and applicant scope. ifs 3D Animation uses CGL submission plus uni-assist validation for international applicants with non-German degrees.
- `fees`: individual amounts with `kind`, `euros`, `period`, `appliesTo`, optional `notes`, `cycle` and `approximate`. Preserve fee scopes and periods. Approximate contributions are not exact future prices. The €250 ifs study-fund contribution is already included in published MA tuition, not an extra charge.
- `requirements`: labelled notes, including degree prerequisites and exceptional **non-degree** training participation.
- `sources`: field-to-official-URL map.
- `researched`: retrieval date, not a guarantee that rules remain valid in a future cycle.

`tuition_eur_per_semester` stays `null` when no single applicant-independent amount is supported; inspect scoped `fees` instead. `null` does not mean free. DFFB’s ticket amount is left unverified because its English admissions and German FAQ publish conflicting amounts and charging periods; both quoted figures remain in the fee notes.

Deadline bounds retain `year` for a single announced round. `open_on` does not roll dated windows into later years. DFFB’s main cutoff is mandatory portal registration; its later assignment deadline remains in route notes and the website’s separate event. Unpublished ifs dates stay absent, even where the winter intake is confirmed.

New programmes without genuine embeddings remain available through school/programme endpoints and text search. Their vector alternatives are empty rather than invented. Semantic search additionally needs its configured embedding provider; it is not a substitute for complete text search.

## Updating and testing

From the repository root:

```bash
npm run build:relations
npm run build:api-artifacts
cd api
npm run typecheck
npm test
npx wrangler deploy
```

The build scripts require the ignored local `data/program_embeddings.json`. CI uses committed artifacts if that file is unavailable. Deployment needs authorized Cloudflare credentials; CI deployment skips when `CLOUDFLARE_API_TOKEN` is absent. Never commit credentials.
