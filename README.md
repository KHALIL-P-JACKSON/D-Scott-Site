# D'Luxe Beauty — studio site

Single-page marketing site for the nail studio: menu and pricing, recent work,
reviews, and an appointment request form. Built with React + TypeScript + Vite,
deployed to GitHub Pages.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b` across the app, test and config projects |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Re-run tests on change |
| `npm run test:coverage` | Tests plus coverage thresholds |
| `npm run verify` | lint + typecheck + test — run this before pushing |

## Where the content lives

Most edits are content, not code:

- **`src/data/services.ts`** — the whole menu and price list. It is also the
  single source of truth for the booking dropdown, so prices cannot drift out of
  sync between the menu and the form.
- **`src/data/heroSlides.ts`** — the hero carousel photos. Drop a file into
  `public/` and reference it here as `./FILE_NAME.JPEG`.
- **`src/data/reviews.ts`** — client reviews.
- **`src/types/index.ts`** — shared types.

## Testing

Vitest + React Testing Library + jsdom.

- Pure data and logic specs declare `// @vitest-environment node`, so they run
  without a DOM and finish in milliseconds.
- Component and integration specs run under jsdom. `src/test/setup.ts` shims the
  APIs jsdom lacks but Radix UI needs (`matchMedia`, `ResizeObserver`,
  `scrollIntoView`, pointer capture).
- `src/test/render.tsx` wraps components in the same Radix `Theme` as
  `src/main.tsx`.
- Coverage thresholds apply to `src/data` and `src/lib` only; presentational
  components are covered behaviourally rather than by line count.

What the suite protects:

- **the published price list**, transcribed as an executable spec, plus sanity
  checks that longer sets cost more and that a fill always costs less than the
  matching full set (`src/data/services.spec.ts`)
- every hero photo **actually exists in `public/`** and stays under a size budget
- the booking form's validation, confirmation copy, and reset flow
- the menu tabs, the rendered prices, and which service each button books
- carousel autoplay, hover pausing, wrap-around, and `prefers-reduced-motion`
- the app-wide "choose a service → it lands in the booking form" journey, and
  that no in-page link points at a missing section

Two Radix quirks worth knowing before writing new specs:

- every tab label is rendered twice (visible + hidden), so match tab names with a
  regex instead of an exact string;
- `Select` keeps a hidden native `<select>` in sync with its options, which is
  the reliable way to drive a selection from a test.

## Continuous integration

`.github/workflows/ci.yml` is the single source of truth for what a change has to
pass. It runs on every pull request, on pushes to `main`, `develop` and
`creation/**`, and on demand from the Actions tab:

| Job | What it proves |
| --- | --- |
| `Lint, typecheck & test` | ESLint, `tsc -b`, and the Vitest suite with the coverage thresholds from `vitest.config.ts` |
| `Build production bundle` | the app still compiles and bundles |
| `PR merge gate` | fails unless both jobs above succeeded |

### Making a failing test block the merge

A red run only blocks a merge when the check is *required*. One-time setup:

1. **Settings → Rules → Rulesets → New branch ruleset** (or **Settings →
   Branches → Add branch protection rule**) for `main`, and once more for
   `develop`.
2. Turn on **Require status checks to pass**.
3. In the search box, add the required check **`PR merge gate`**.
4. Optionally tick **Require branches to be up to date before merging** so a PR is
   re-tested against the latest base.

Require `PR merge gate` rather than the individual jobs. GitHub reports a job that
is *skipped* as passing, and a job whose dependency failed is skipped too — the
gate is the one job that always runs and reflects the real result of lint,
typecheck, tests and the build, so it cannot be satisfied while anything is red.

Deployment is gated the same way: `.github/workflows/static.yml` only runs for
`main` (plus manual runs). Its `verify` job calls `ci.yml`, and the `deploy` job
depends on it, so a commit that fails lint, typecheck, tests or the build cannot
reach the live site even if it is pushed straight to `main`. Pull requests never
deploy, because the workflow is not triggered by them at all.

## Deployment

Pushing to `main` publishes `dist/` to GitHub Pages under `/D-Scott-Site/`.
`base: './'` in `vite.config.ts` keeps assets and `public/` photos resolving
correctly from that sub-path.

