# Four Thousand Weeks

A life ledger. It lays out roughly four thousand weeks, the length of a long human life, as a
grid: mark the weeks behind you, map projects and chapters onto the ones ahead, and pin the
milestones that matter.

## Using it

- **Timeline mode.** _Horizon_ shows 4,000 weeks from any start date. _Birth · Full_ starts at
  your birth week; _Birth · Remaining_ shows only the weeks still ahead.
- **Weeks.** Click or drag across the grid to mark weeks as passed. _Sync Elapsed to Today_
  marks everything before the current week. Arrow keys move between weeks.
- **Events** cover a date range and get a color. **Milestones** are single dates.
- **Analytics** charts how many events are active per year or decade.

## Your data

Everything stays in your browser's `localStorage` under the key `ftw:v1`. Nothing is sent
anywhere, so clearing site data or switching browsers starts you over. Use **Export** to save a
JSON backup and **Import** to restore one. Import asks before replacing the current ledger and
offers an undo afterwards.

The export is the `Persisted` shape in `src/lib/types.ts`. Passed weeks are stored as absolute week
numbers (Mondays counted from 1970-01-05), so they survive changes to the mode or start date. All
date math runs on UTC calendar dates, so a week never shifts with the viewer's time zone or
daylight saving.

## Development

Requires Node 26 and pnpm 12 (see `.nvmrc` and `packageManager`).

```bash
pnpm install
```

```bash
pnpm dev
```

| Script           | What it does                                                  |
| ---------------- | ------------------------------------------------------------- |
| `pnpm dev`       | Dev server on http://localhost:3000                           |
| `pnpm build`     | Production build (the app is fully static)                    |
| `pnpm test`      | Unit tests (Vitest): dates, storage validation, state reducer |
| `pnpm typecheck` | Generates Next's route types, then runs `tsc`                 |
| `pnpm lint`      | oxlint, failing on warnings                                   |
| `pnpm format`    | oxfmt; `pnpm format:check` only reports                       |

Lint, format and TypeScript settings come from
[`erakor/toolchain`](https://github.com/erakor/toolchain), which also provides the CI checks in
`.github/workflows/checks.yml`. Change shared settings there, not here.

### Layout

- `src/lib/`: pure logic. `dates.ts` (UTC calendar math), `timeline.ts` (grid layout and event
  indexing), `storage.ts` (persistence and import validation).
- `src/hooks/useLedgerState.ts`: the app state reducer, hydration and debounced saving.
- `src/components/`: the UI. `LedgerApp.tsx` wires it together.
