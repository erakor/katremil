import { describe, expect, it } from 'vitest'
import { addWeeks, daysBetween } from './dates'
import { TOTAL, cellDateAt } from './life'
import {
  UNITS,
  elapsedPct,
  formatPct,
  formatSpan,
  markAt,
  marksFor,
  nextMark,
  nextUnit,
} from './milestones'

const BIRTH = '1990-01-01'
const marks = marksFor(BIRTH)

describe('marks', () => {
  it('date week N from birth + (N - 1) * 7 days', () => {
    expect(marks.map((m) => m.week)).toEqual([1000, 2000, 3000, 4000])
    expect(marks[3].dateISO).toBe(addWeeks(BIRTH, 3999))
    expect(daysBetween(BIRTH, marks[3].dateISO)).toBe(27993)
  })

  it('place each mark in the cell that holds its date, not cell N - 1', () => {
    for (const m of marks) {
      expect(cellDateAt(BIRTH, m.cell) <= m.dateISO).toBe(true)
      if (m.cell + 1 < TOTAL) expect(cellDateAt(BIRTH, m.cell + 1) > m.dateISO).toBe(true)
    }
    // Rows are calendar years of 52 cells, so the 4,000th week lands well before cell 3999.
    expect(marks[3].cell).toBeLessThan(3999)
    expect(markAt(marks, marks[2].cell)?.week).toBe(3000)
    expect(markAt(marks, marks[2].cell + 1)).toBeNull()
  })

  it('finds the next mark ahead of the current cell', () => {
    expect(nextMark(marks, 0)).toMatchObject({ week: 1000, inWeeks: marks[0].cell })
    expect(nextMark(marks, marks[0].cell)?.week).toBe(2000)
  })

  it('returns null after the last mark', () => {
    expect(nextMark(marks, marks[3].cell)).toBeNull()
    expect(nextMark(marks, TOTAL - 1)).toBeNull()
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

describe('formatPct', () => {
  it('floors to one decimal so it never reads 100% early', () => {
    expect(formatPct(elapsedPct(TOTAL - 1))).toBe('99.9%')
    expect(formatPct(49.27)).toBe('49.2%')
    expect(formatPct(100)).toBe('100.0%')
  })
})

describe('formatSpan', () => {
  it('formats whole weeks from days, with a singular', () => {
    expect(formatSpan(14830, 'weeks')).toBe('2,118 weeks')
    expect(formatSpan(7, 'weeks')).toBe('1 week')
  })

  it('formats days and months', () => {
    expect(formatSpan(70, 'days')).toBe('70 days')
    expect(formatSpan(365.2425, 'months')).toBe('12 months')
  })

  it('splits years and weeks', () => {
    // About 40.6 years: 40 years and 31 weeks.
    expect(formatSpan(14830, 'years')).toBe('40 years 31 weeks')
    expect(formatSpan(731, 'years')).toBe('2 years 0 weeks')
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
