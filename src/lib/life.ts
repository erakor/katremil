import { addWeeks, addYears, daysBetween } from './dates'
import type { PigmentKey } from './pigments'

export const ROWS = 80
export const COLS = 52
export const TOTAL = ROWS * COLS

export interface Chapter {
  id: string
  label: string
  startISO: string
  /** Absent means the chapter is ongoing. */
  endISO?: string
  pigment: PigmentKey
}

export interface Life {
  birthISO: string
  chapters: Chapter[]
}

export const rowOf = (cell: number) => Math.floor(cell / COLS)
export const colOf = (cell: number) => cell % COLS

/** Start date of the cell at row r (age in years) and column c (week of that year). */
export function cellDate(birthISO: string, r: number, c: number): string {
  return addWeeks(addYears(birthISO, r), c)
}

export function cellDateAt(birthISO: string, cell: number): string {
  return cellDate(birthISO, rowOf(cell), colOf(cell))
}

/** The cell that contains `today`, clamped to the grid. */
export function currentCell(birthISO: string, today: string): number {
  if (today <= birthISO) return 0
  let row = Number(today.slice(0, 4)) - Number(birthISO.slice(0, 4))
  row = Math.min(ROWS - 1, Math.max(0, row))
  while (row > 0 && addYears(birthISO, row) > today) row--
  while (row < ROWS - 1 && addYears(birthISO, row + 1) <= today) row++
  const col = Math.min(COLS - 1, Math.floor(daysBetween(addYears(birthISO, row), today) / 7))
  return row * COLS + Math.max(0, col)
}

function allCellDates(birthISO: string): string[] {
  const out = Array.from<string>({ length: TOTAL })
  for (let r = 0; r < ROWS; r++) {
    const rowStart = addYears(birthISO, r)
    for (let c = 0; c < COLS; c++) out[r * COLS + c] = addWeeks(rowStart, c)
  }
  return out
}

/** Chapter index for every cell (later chapters win overlaps); -1 where none applies. */
export function chapterIndexForCells(life: Life, today: string): Int16Array {
  const out = new Int16Array(TOTAL).fill(-1)
  const dates = allCellDates(life.birthISO)
  // A cell spans [its start, the next cell's start), so a row's last cell takes the 1-2 spare days.
  const gridEnd = addYears(life.birthISO, ROWS)
  life.chapters.forEach((ch, idx) => {
    const end = ch.endISO ?? today
    for (let i = 0; i < TOTAL; i++) {
      const next = i + 1 < TOTAL ? dates[i + 1] : gridEnd
      if (ch.startISO < next && dates[i] <= end) out[i] = idx
    }
  })
  return out
}

/** Final past cell of each chapter that has ended: cell index -> chapter index. */
export function lastWeekCells(life: Life, today: string): Map<number, number> {
  const out = new Map<number, number>()
  const dates = allCellDates(life.birthISO)
  const cur = currentCell(life.birthISO, today)
  life.chapters.forEach((ch, idx) => {
    if (!ch.endISO || ch.endISO >= today) return
    let last = -1
    for (let i = 0; i < TOTAL; i++) {
      if (dates[i] <= ch.endISO) last = i
      else break
    }
    if (last >= 0 && last < cur && dates[last] >= ch.startISO) out.set(last, idx)
  })
  return out
}

/** Whole weeks from `startISO` through `endISO` (both days included), at least one. */
export const spanWeeks = (startISO: string, endISO: string): number =>
  Math.max(1, Math.floor((daysBetween(startISO, endISO) + 1) / 7))

/** Length of each chapter in weeks (ongoing chapters run to today). */
export function chapterWeeks(life: Life, today: string): { label: string; weeks: number }[] {
  return life.chapters.map((ch) => ({
    label: ch.label,
    weeks: spanWeeks(ch.startISO, ch.endISO ?? today),
  }))
}
