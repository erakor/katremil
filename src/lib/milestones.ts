import { fmtInt } from './dates'
import { TOTAL } from './life'

/** The book's round number, in 1,000-week steps. Week N is cell N - 1. */
export const WEEK_MARKS = [1000, 2000, 3000, 4000] as const
export const MARK_CELLS: number[] = WEEK_MARKS.map((w) => w - 1)

const MARK_BY_CELL = new Map<number, number>(WEEK_MARKS.map((w) => [w - 1, w]))

/** The week number (1,000 ...) when `cell` is one of the marks, otherwise null. */
export const markWeek = (cell: number): number | null => MARK_BY_CELL.get(cell) ?? null

export interface NextMark {
  week: number
  cell: number
  /** Whole weeks from the current week to the mark. */
  inWeeks: number
}

/** The first mark still ahead of the current week, or null once all four are behind you. */
export function nextMark(current: number): NextMark | null {
  const week = WEEK_MARKS.find((w) => w - 1 > current)
  return week === undefined ? null : { week, cell: week - 1, inWeeks: week - 1 - current }
}

/** Share of the grid already behind you, in percent. */
export const elapsedPct = (current: number): number =>
  (Math.min(TOTAL, Math.max(0, current)) / TOTAL) * 100

/** Weeks in a mean solar year, and days in a mean month. */
export const WEEKS_PER_YEAR = 365.2425 / 7
export const DAYS_PER_MONTH = 365.2425 / 12

export type RemainingUnit = 'weeks' | 'years' | 'months' | 'days'
export const UNITS: RemainingUnit[] = ['weeks', 'years', 'months', 'days']

export const nextUnit = (u: RemainingUnit): RemainingUnit =>
  UNITS[(UNITS.indexOf(u) + 1) % UNITS.length]

const plural = (n: number, word: string) => `${fmtInt(n)} ${word}${Math.round(n) === 1 ? '' : 's'}`

/** "2,111 weeks", "40 years 12 weeks", "486 months" or "14,777 days", for a span of weeks. */
export function formatSpan(weeks: number, unit: RemainingUnit): string {
  const w = Math.max(0, weeks)
  switch (unit) {
    case 'weeks':
      return plural(w, 'week')
    case 'months':
      return plural((w * 7) / DAYS_PER_MONTH, 'month')
    case 'days':
      return plural(w * 7, 'day')
    case 'years': {
      let y = Math.floor(w / WEEKS_PER_YEAR)
      let rest = Math.round(w - y * WEEKS_PER_YEAR)
      if (rest >= 52) {
        y += 1
        rest = 0
      }
      return `${plural(y, 'year')} ${plural(rest, 'week')}`
    }
  }
}
