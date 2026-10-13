# German Art Schools

An interactive guide to art, design, film, music and media programs at German universities and specialist schools. Compare 95 schools and 790 program records, see how programs relate across schools, and plan applications around real deadlines, language rules and costs.

**Live:** https://parsaa74.github.io/german-art-schools/

## Features

- **Network** — every point is a program (or, in Schools mode, a school). Threads are computed text similarities between programs, shown with their recorded weight; they are not claims of shared curriculum or partnership. Drag, pinch or zoom to explore, and select a point to follow its threads.
- **List view** — an accessible static list of the same programs, ordered by name, school or application window.
- **Constraints** — subject, degree, teaching language, state, institution type, intake, NC-free admission, application route (direct or uni-assist), portfolio, a tuition cap and application timing. Each constraint applies to the same program. Programs with missing facts appear as *not confirmed*, separately from those outside your constraints.
- **Details** — deadlines, application route, admission, requirements, scoped fees (including non-EU tuition), teaching areas, faculty, official links and the sources each fact came from.
- **Kept** — keep programs and schools without an account. The list stays in your browser, and closing dates can be exported to your calendar (`.ics`).
- **Public API** — REST endpoints and an MCP server for the dataset (see [`api/`](api)).

## Data and sources

School and program data lives in [`src/data/enhanced_german_art_schools.json`](src/data/enhanced_german_art_schools.json). Researched fields carry a link to the official page they came from and the date it was checked. The audited facts, with their supporting quotes, are listed in [`data/research/`](data/research).

- Deadlines without a year repeat every year. Deadlines with a year (e.g. *5 March 2027*) are for one application round only and are never carried forward.
- Membership of uni-assist comes from the [uni-assist member list](https://www.uni-assist.de/tools/uni-assist-hochschulen/).
- DFFB’s own diploma is explicitly a **non-state qualification**, not a university Bachelor, Master or Diplom. ifs Film specialisations and Serial Storytelling language tracks stay inside their actual parent degrees.
- HFBK’s Film focus is searchable within the actual Fine Arts BFA/MFA, with sourced film-department staff and application notes. The separately administered HMS cooperative master is not the same degree. Subject filtering includes officially sourced study focuses, not only the degree title.
- Programme-specific application handling routes override broad school membership when sourced. Direct submission does not guarantee foreign-qualification validation is free; ifs 3D Animation requires uni-assist validation for international applicants with non-German degrees.
- The API additionally exposes scoped fees, route notes, requirements, field sources and retrieval dates. Approximate fees retain that label; a single tuition number is left unknown when costs differ by applicant.
- Not every program is fully researched yet. Missing information is shown as unknown rather than guessed. New programmes without genuine embeddings remain searchable but have no fabricated vector alternatives.

This is an independent project, not an official source. Admission rules change, so always confirm details on the school's own page before applying.

## Development

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173/german-art-schools/
npm run build      # production build in dist/
```

### Keeping the data current

| Command | Purpose |
| --- | --- |
| `npm run apply:uni-assist` | Refresh which schools apply via uni-assist (each application season). |
| `npm run build:relations` | Rebuild school and program relationships. Needs the local embeddings file `data/program_embeddings.json` (`npm run build:program-embeddings`). |
| `npm run build:api-artifacts` | Regenerate the API data in `api/data/`, then run `cd api && npm test`. |
| `npm run check:filters` | Self-check filters, deadlines and the application check against the data. |
| `npm run check:focus` | Self-check the network model: original similarity weights, unknown vs outside, scoped fees. |

## Tech stack

Plain JavaScript on a 2D canvas, d3-force, Zustand and Vite. The API runs on Cloudflare Workers.

## Acknowledgements

- *These URLs will save you irl* (Nilya Musaeva, Alberto Hares, 2024) — https://github.com/mneunomne/these_urls_will_save_the_irl

## License

MIT — see [LICENSE](LICENSE).
