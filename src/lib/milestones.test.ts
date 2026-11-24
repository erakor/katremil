import { describe, expect, it } from 'vitest'
import { TOTAL } from './life'
import {
  MARK_CELLS,
  UNITS,
  elapsedPct,
  formatSpan,
  markWeek,
  nextMark,
  nextUnit,
} from './milestones'

describe('marks', () => {
  it('sit on weeks 1,000 to 4,000, which are cells 999 to 3999', () => {
    expect(MARK_CELLS).toEqual([999, 1999, 2999, 3999])
    expect(markWeek(2999)).toBe(3000)
    expect(markWeek(3000)).toBeNull()
  })

  it('finds the next mark ahead of the current week', () => {
    expect(nextMark(0)).toEqual({ week: 1000, cell: 999, inWeeks: 999 })
    expect(nextMark(2048)).toEqual({ week: 3000, cell: 2999, inWeeks: 951 })
  })

  it('does not count the week you are standing on as ahead', () => {
    expect(nextMark(999)?.week).toBe(2000)
  })

  it('returns null after the last mark', () => {
    expect(nextMark(3999)).toBeNull()
    expect(nextMark(TOTAL - 1)).toBeNull()
  })
})

describe('elapsedPct', () => {
  it('is the share of the grid behind you, clamped', () => {
    expect(elapsedPct(0)).toBe(0)
    expect(elapsedPct(TOTAL / 2)).toBe(50)
    expect(elapsedPct(TOTAL * 2)).toBe(100)
    expect(elapsedPct(-5)).toBe(0)
  })
})

describe('formatSpan', () => {
  it('formats weeks, with a singular', () => {
    expect(formatSpan(2111, 'weeks')).toBe('2,111 weeks')
    expect(formatSpan(1, 'weeks')).toBe('1 week')
  })

  it('formats days and months from weeks', () => {
    expect(formatSpan(10, 'days')).toBe('70 days')
    expect(formatSpan(52.1775, 'months')).toBe('12 months')
  })

  it('splits years and weeks without ever showing 52 weeks', () => {
    expect(formatSpan(2111, 'years')).toBe('40 years 24 weeks')
    // 104 weeks is 1 year and 51.8 weeks, which rounds up to a whole second year.
    expect(formatSpan(104, 'years')).toBe('2 years 0 weeks')
  })

  it('never goes negative', () => {
    expect(formatSpan(-3, 'weeks')).toBe('0 weeks')
  })
})

describe('nextUnit', () => {
  it('cycles through every unit and wraps', () => {
    let u = UNITS[0]
    const seen = [u]
    for (let i = 0; i < UNITS.length; i++) {
      u = nextUnit(u)
      seen.push(u)
    }
    expect(seen).toEqual([...UNITS, UNITS[0]])
  })
})
