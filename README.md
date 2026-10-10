# German Art Schools Visualization

An exploration of German universities offering Art, Media, and Design programs.

## Overview

This project is my personal work developed during my application journey for Digital Media studies. It transforms educational data into an immersive visual experience with both 3D and 2D interactive visualizations.

## Key Features

- Combined 3D globe and 2D force-directed network views
- Data on 73 German art schools with program details and histories

## Installation

```bash
npm install
npm run dev
```

## Keeping the data current

- `npm run apply:uni-assist` — refresh which schools use uni-assist (re-run each application season).
- `npm run build:relations` — rebuild the school/program relationships after editing programs. Needs the
  local embeddings file `data/program_embeddings.json` (not in git; create it with `npm run build:program-embeddings`).
- `npm run build:api-artifacts` — regenerate the API data in `api/data/` (then `cd api && npm test`).
- `npm run check:filters` — self-check of the filters against the data.

NC-free admission (portfolio / aptitude test, or open admission) is derived per program in
`src/lib/taxonomy.ts` (`admissionOf`); researched exceptions are stored on the program with an `admissionSource` URL.

## Inspiration

- These URLs will save you irl (Nilya Musaeva, Alberto Hares, 2024) (https://github.com/mneunomne/these_urls_will_save_the_irl)


## License

This project is available under the MIT License. See the `LICENSE` file for details.
