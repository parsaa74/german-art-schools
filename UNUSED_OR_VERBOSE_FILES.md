# Similar or Duplicate Files Audit

_Expert review focusing on similarly named files that may be redundant or candidates for consolidation._

---

## 1. **Font Files**

- **Locations:**
  - `public/fonts/`
  - `public/Inter/`
  - `public/german-art-schools/`
- **Comment:** All contain Inter font files in various formats.
- **Suggestion:** Consolidate all font files into a single directory (e.g., `public/fonts/`). Update CSS `@font-face` rules accordingly to reduce duplication and confusion.

---

## 2. **Stylesheets**

- **Files:**
  - `src/app/globals.css`
  - `src/styles/globals.css`
- **Comment:** Having two global stylesheets can cause conflicts.
- **Suggestion:** Keep only one, preferably `src/app/globals.css` if using Next.js App Router. Remove or merge the other.

---

## 3. **Sentry Config Files**

- **Files:**
  - `sentry.edge.config.js`
  - `sentry.edge.config.ts`
  - `sentry.server.config.js`
  - `sentry.server.config.ts`
- **Comment:** Both `.js` and `.ts` versions are redundant.
- **Suggestion:** Keep only the `.ts` files if your project is TypeScript-based. Remove `.js` versions to avoid confusion.

---

## 4. **Type Definitions**

- **Files:**
  - `src/types/common.ts`
  - `src/types/global.d.ts`
  - `src/types/index.ts`
  - `src/types/map.ts`
  - `src/types/school.ts`
  - `src/types/StudentProfile.ts`
- **Comment:** Potential overlap in type definitions.
- **Suggestion:** Review and consolidate common/shared types into fewer files to improve maintainability.

---

## 5. **Map Utilities**

- **Files:**
  - `src/constants/map.ts`
  - `src/lib/geo-utils.ts`
  - `src/lib/mapProjection.ts`
  - `src/lib/geo/`
- **Comment:** Possible overlap in map-related constants and utilities.
- **Suggestion:** Consolidate related logic into a single module or namespace for clarity.

---

## 6. **Summary**

- **Consolidate font files** into one directory.
- **Keep a single global stylesheet**.
- **Remove redundant Sentry config files**.
- **Unify type definitions** to avoid duplication.
- **Merge map-related utilities/constants** where possible.

_This will reduce confusion, improve maintainability, and streamline your creative codebase._