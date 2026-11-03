# German Art Schools API

Read-only REST API and MCP server for the same catalogue as the website.

- REST: https://german-art-schools-api.parsaazari21.workers.dev/v1/meta
- OpenAPI: https://german-art-schools-api.parsaazari21.workers.dev/openapi.json
- MCP (Streamable HTTP): https://german-art-schools-api.parsaazari21.workers.dev/mcp

```text
GET /v1/schools
GET /v1/schools/{id}
GET /v1/programs?school={id}&q=Film
GET /v1/programs?subject=film-television&language=english
```

Missing values are `null` or empty, never guessed. A `null` tuition does not mean free; check the scoped `fees` and the school's `non_eu_tuition`. Records marked `not-matched` or `discontinued` stay fetchable by id with their warning but never appear in listings, search or a school's `program_ids`. Confirm details on the school's own page before applying.

## Testing

```bash
npm run typecheck
npm test
```
