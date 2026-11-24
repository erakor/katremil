import { addDays, addYears, daysBetween } from './dates'
import { ROWS, spanWeeks } from './life'
import type { Chapter } from './life'

/** Fixed on purpose: the readout always compares now with these two ages. */
export const PROJECTION_AGES = [60, 80] as const

export interface ChapterShare {
  /** Chapter length in weeks so far (same count as chapterWeeks). */
  weeks: number
  /** Share of the life lived so far, in percent. */
  now: number
  /** Share of the life lived by each age still ahead, in percent. */
  projections: { age: number; pct: number }[]
  /** True when the chapter is still running today, so its projections assume it continues. */
  grows: boolean
}

// Everything is measured in real weeks (days / 7), with ages at birthdays, which is exactly
// where the grid's rows start. chapterWeeks counts real weeks, so dividing by 52 cells per year
// would mix units and let a chapter that spans a whole life pass 100%.

/** Weeks lived from birth through `end` (inclusive). */
const livedThrough = (birthISO: string, end: string) => (daysBetween(birthISO, end) + 1) / 7

const share = (part: number, whole: number) => Math.min(100, (part / Math.max(whole, 1 / 7)) * 100)

/**
 * How much of the life this chapter takes up now, and by ages 60 and 80.
 * An ended chapter only gets diluted. One still running today is assumed to continue
 * (up to its end date, when it has one). Ages already reached, or past the grid, are dropped.
 * Returns null for a chapter that has not started yet.
 */
export function chapterShare(birthISO: string, ch: Chapter, today: string): ChapterShare | null {
  if (ch.startISO > today) return null
  const grows = ch.endISO === undefined || ch.endISO >= today
  const endBy = (date: string) => (ch.endISO !== undefined && ch.endISO < date ? ch.endISO : date)

  const weeks = spanWeeks(ch.startISO, endBy(today))
  const projections: ChapterShare['projections'] = []
  for (const age of PROJECTION_AGES) {
    const birthday = addYears(birthISO, age)
    if (age > ROWS || birthday <= today) continue
    // The life lived by an age ends the day before that birthday.
    const lastDay = addDays(birthday, -1)
    projections.push({
      age,
      pct: share(spanWeeks(ch.startISO, endBy(lastDay)), livedThrough(birthISO, lastDay)),
    })
  }
  return { weeks, now: share(weeks, livedThrough(birthISO, today)), projections, grows }
}
