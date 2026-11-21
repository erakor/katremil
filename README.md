# Four Thousand Weeks

A perspective engine, not a tracker. One grid of 80 rows by 52 columns, 4,160 squares: every
week of a long life, one row per year of age. There is nothing to log and nothing to plan. You
look, move the pointer, and the numbers do the arguing.

## Using it

- **Whose life.** _Age 10 · 30 · 39 · 65_ are sample lives (39 is the default). _Yours_ takes
  your birth date and your own chapters.
- **Chapters lens.** Past weeks are colored by chapter, the current week glows amber, and the
  future is a hairline outline. Hover the last week of any ended chapter to see it lift.
- **Time.** The _How it feels_ slider warps row heights from the clock (every year equal) to
  felt time, where early years take more room and late ones less.
- **X-ray.** Layers for sleep, work, and the first years you will never remember. Hold
  <kbd>Space</kbd> anywhere to peek at all three. The readout counts the weeks ahead that are
  still awake and unclaimed.
- **Stamps.** Pick a chip (a summer, college, a kid at home, a dog's lifespan), hover the grid,
  and see what that stretch is as a share of your life at that age, of your life so far, and of
  felt time. Click to leave it in place; <kbd>Esc</kbd> clears.
- **Times Left lens.** Choose something you do a few times a year, set the pace and an end age,
  and see the occasions behind you and ahead of you as dots.
- **Keyboard.** Focus the grid, then arrows move one week or one year, <kbd>Shift</kbd> moves
  ten weeks or ten years, <kbd>Enter</kbd> places the chosen stamp.

## Your data

Only a custom life (birth date and chapters) is saved, in `localStorage` under `ftw:v2`. Sample
lives are derived from today's date and never stored; editing one forks it into _Yours_. The
old ledger format (`ftw:v1`) is ignored. Nothing is sent anywhere.

## How it is built

Next.js (App Router), React, Tailwind v4. The grid is a single DPR-aware `<canvas>` painted by
a pure `drawScene` in `src/lib/render.ts`, so warping and x-ray fades never touch layout. All
the math (cells, warp weights, stamps, times left, microcopy, storage validation) lives in
`src/lib/` and is unit-tested.

```bash
pnpm install
pnpm dev
```

```bash
pnpm test
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```
