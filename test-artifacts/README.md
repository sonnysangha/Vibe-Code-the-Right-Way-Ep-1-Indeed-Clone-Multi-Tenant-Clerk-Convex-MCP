# Job letter outbound — verification artifacts

Generated on **2026-05-06** in the cloud workspace while validating the landing animation changes.

## What ran cleanly

| Check | Artifact |
|-------|-----------|
| `next build` (placeholder `.env*`‑compatible URLs inlined at build time) | `build.txt` |
| Targeted ESLint on `components/landing/job-letter-outbound.tsx` | `eslint-job-letter.txt` (empty output ⇒ exit **0**) |
| Synthetic geometry regression / PNG diagram | `job-letter_geometry_proof.png`, script `scripts/prove_job_letter_geometry.py` |

## Known gaps

### Full ESLint

`npm run lint` still fails on **other files** (profile mount guard pattern, notification bell). See **`lint-full.txt`**.

### Headless Playwright against Next.js

`scripts/capture_job_letter_section.py` expects **`next start` / `next dev`** plus valid Clerk keys.

Production/start rejects placeholder **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** values (“Publishable key not valid”), so **no live screenshots** were produced here without dashboard‑issued keys.

**To reproduce locally (recommended)**

```bash
# populate real Clerk + Convex variables first (.env.local)
pnpm exec npm-run-all --parallel dev:frontend dev:backend
# separate terminal:
python3 scripts/capture_job_letter_section.py
```

Artifacts land in this folder (`job-letter_section_viewport.png`, `job-letter_scroll_*.png`).

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/prove_job_letter_geometry.py` | Mirrors Bézier math; asserts shortened endpoints sit above targets; writes `job-letter_geometry_proof.png`. |
| `scripts/capture_job_letter_section.py` | Playwright screenshots when app serves `/`. Requires Chromium (`python3 -m playwright install chromium`). |

## Portable toolchain note

Portable Node.js used only inside `.tools/` (ignored by git) to drive npm scripts where system Node was absent.
