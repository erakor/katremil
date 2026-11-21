import { COLS, TOTAL } from './life'
import { feltShare } from './warp'

export interface StampDef {
  id: string
  label: string
  weeks: number
}

export const STAMPS: StampDef[] = [
  { id: 'summer', label: '10-wk Summer', weeks: 10 },
  { id: 'college', label: '4-yr College', weeks: 208 },
  { id: 'chapter', label: '6-yr Chapter', weeks: 312 },
  { id: 'kid', label: 'Kid at Home', weeks: 936 },
  { id: 'dog', label: "Dog's Lifespan", weeks: 676 },
]

export interface StampMath {
  /** Cells actually covered after clipping at the end of the grid. */
  cells: number
  pctOfGrid: number
  /** Weeks as a share of the life lived up to the anchor. */
  pctOfLifeAtAge: number
  /** Weeks as a share of the life lived so far. */
  pctOfLifeToday: number
  /** Share of felt life (the warped grid), in percent. */
  felt: number
  equivalence: string
}

const SUMMER_WEEKS = 13

function equivalence(n: number, chapters: { label: string; weeks: number }[]): string {
  let best: { label: string; diff: number } | null = null
  for (const c of chapters) {
    const diff = Math.abs(c.weeks - n) / n
    if (diff <= 0.3 && (!best || diff < best.diff)) best = { label: c.label, diff }
  }
  if (best) return `about as long as your “${best.label}” chapter`
  const summers = Math.round(n / SUMMER_WEEKS)
  return summers <= 1 ? 'about one summer' : `roughly ${summers} summers`
}

/** Stamp covering `n` weeks row-major from `anchor`, clipped at the last row. */
export function stampMath(
  anchor: number,
  n: number,
  current: number,
  chapters: { label: string; weeks: number }[] = [],
): StampMath {
  const cells = Math.max(0, Math.min(n, TOTAL - anchor))
  return {
    cells,
    pctOfGrid: (n / TOTAL) * 100,
    pctOfLifeAtAge: Math.min(100, (n / Math.max(anchor, 1)) * 100),
    pctOfLifeToday: Math.min(100, (n / Math.max(current, 1)) * 100),
    felt: feltShare(anchor, cells) * 100,
    equivalence: equivalence(n, chapters),
  }
}

export const stampAge = (anchor: number) => Math.floor(anchor / COLS)
