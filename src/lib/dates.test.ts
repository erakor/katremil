import { afterEach, describe, expect, it } from 'vitest'
import * as d from './dates'

// [date, its Monday, weeks since 1990-06-11, weekId, formatted week]
const PROBES: [string, string, number, number, string][] = [
  ['2026-03-07', '2026-03-02', 1864, 2930, 'Mar 2–8, 2026'],
  ['2026-03-08', '2026-03-02', 1864, 2930, 'Mar 2–8, 2026'], // US DST starts
  ['2026-03-09', '2026-03-09', 1865, 2931, 'Mar 9–15, 2026'],
  ['2026-11-01', '2026-10-26', 1898, 2964, 'Oct 26–Nov 1, 2026'], // US DST ends
  ['2026-11-02', '2026-11-02', 1899, 2965, 'Nov 2–8, 2026'],
  ['2026-09-27', '2026-09-21', 1893, 2959, 'Sep 21–27, 2026'], // NZ DST starts
  ['2026-04-05', '2026-03-30', 1868, 2934, 'Mar 30–Apr 5, 2026'], // NZ DST ends
  ['2000-02-29', '2000-02-28', 507, 1573, 'Feb 28–Mar 5, 2000'],
]
const START = d.mondayOf('1990-06-15')

describe.each(['UTC', 'America/New_York', 'Pacific/Auckland', 'Asia/Kolkata'])(
  'week boundaries in %s',
  (tz) => {
    const original = process.env.TZ
    afterEach(() => {
      process.env.TZ = original
    })

    it.each(PROBES)('%s', (iso, monday, weeks, id, range) => {
      process.env.TZ = tz
      expect(d.mondayOf(iso)).toBe(monday)
      expect(d.weeksBetween(START, iso)).toBe(weeks)
      expect(d.weekId(iso)).toBe(id)
      expect(d.formatRange(monday, d.addDays(monday, 6))).toBe(range)
    })

    it('numbers 4,000 consecutive weeks without gaps', () => {
      process.env.TZ = tz
      const base = d.weekId(START)
      for (let i = 0; i < 4000; i++) expect(d.weekId(d.addWeeks(START, i)) - base).toBe(i)
    })
  },
)

describe('isValidISO', () => {
  it('accepts real calendar dates', () => {
    expect(d.isValidISO('2024-02-29')).toBe(true)
  })
  it.each(['2023-02-29', '2024-13-01', '2024-1-01', '', 20240101, null])('rejects %s', (v) => {
    expect(d.isValidISO(v)).toBe(false)
  })
})

describe('formatRange', () => {
  it('spans years', () => {
    expect(d.formatRange('2026-12-28', '2027-01-03')).toBe('Dec 28, 2026–Jan 3, 2027')
  })
  it('collapses a single day', () => {
    expect(d.formatRange('2026-03-08', '2026-03-08')).toBe('Mar 8, 2026')
  })
})

describe('addYears', () => {
  it('adds whole years on the calendar', () => {
    expect(d.addYears('2020-06-15', 5)).toBe('2025-06-15')
  })
  it('turns fractions into days', () => {
    expect(d.addYears('2020-01-01', 0.5)).toBe(d.addDays('2020-01-01', 183))
  })
})

describe('formatYearsWeeks', () => {
  it('splits weeks into solar years and weeks', () => {
    expect(d.formatYearsWeeks(0)).toBe('0y 0w')
    expect(d.formatYearsWeeks(60)).toBe('1y 8w')
  })
})
