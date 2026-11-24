import { addWeeks, fmtInt } from './dates'
import { TOTAL, currentCell } from './life'

/** The book's round number, in 1,000-week steps. */
const WEEK_MARKS = [1000, 2000, 3000, 4000] as const

export interface Mark {
  /** 1,000, 2,000, ... */
  week: number
  /** The day week N starts: birth + (N - 1) * 7 days. */
  dateISO: string
  /** The grid cell that contains that day. Grid rows are calendar years, so this drifts from N - 1. */
  cell: number
}

/** Where each 1,000-week mark falls on the grid for this birth date. */
export function marksFor(birthISO: string): Mark[] {
  return WEEK_MARKS.map((week) => {
    const dateISO = addWeeks(birthISO, week - 1)
    return { week, dateISO, cell: currentCell(birthISO, dateISO) }
  })
}

/** The mark that falls in `cell`, otherwise null. */
export const markAt = (marks: Mark[], cell: number): Mark | null =>
  marks.find((m) => m.cell === cell) ?? null

export interface NextMark extends Mark {
  /** Grid cells from the current one to the mark. */
  inWeeks: number
}

/** The first mark still ahead of the current cell, or null once all four are reached. */
export function nextMark(marks: Mark[], current: number): NextMark | null {
  const m = marks.find((x) => x.cell > current)
  return m ? { ...m, inWeeks: m.cell - current } : null
}

/** Share of the grid already behind you, in percent. */
export const elapsedPct = (current: number): number =>
  (Math.min(TOTAL, Math.max(0, current)) / TOTAL) * 100

/** "12.3%", floored so it never reads 100.0% while any week is left. */
export const formatPct = (p: number): string => `${(Math.floor(p * 10) / 10).toFixed(1)}%`

/** Days in a mean solar year and month, and weeks in a mean year. */
const DAYS_PER_YEAR = 365.2425
const DAYS_PER_MONTH = DAYS_PER_YEAR / 12
const WEEKS_PER_YEAR = DAYS_PER_YEAR / 7

export type RemainingUnit = 'weeks' | 'years' | 'months' | 'days'
export const UNITS: RemainingUnit[] = ['weeks', 'years', 'months', 'days']

export const nextUnit = (u: RemainingUnit): RemainingUnit =>
  UNITS[(UNITS.indexOf(u) + 1) % UNITS.length]

const plural = (n: number, word: string) => `${fmtInt(n)} ${word}${Math.round(n) === 1 ? '' : 's'}`

/** "2,111 weeks", "40 years 31 weeks", "486 months" or "14,830 days", for a span of days. */
export function formatSpan(days: number, unit: RemainingUnit): string {
  const d = Math.max(0, days)
  const w = d / 7
  switch (unit) {
    case 'weeks':
      return plural(Math.floor(w), 'week')
    case 'months':
      return plural(Math.floor(d / DAYS_PER_MONTH), 'month')
    case 'days':
      return plural(d, 'day')
    case 'years': {
      const y = Math.floor(d / DAYS_PER_YEAR)
      const rest = Math.floor(w - y * WEEKS_PER_YEAR)
      return `${plural(y, 'year')} ${plural(rest, 'week')}`
    }
  }
}
