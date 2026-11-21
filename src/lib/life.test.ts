import { describe, expect, it } from 'vitest'
import { addWeeks, addYears } from './dates'
import {
  COLS,
  TOTAL,
  ageAt,
  cellDate,
  chapterIndexForCells,
  chapterWeeks,
  currentCell,
  lastWeekCells,
} from './life'
import { personaLife } from './personas'

const TODAY = '2026-11-21'

describe('cells and dates', () => {
  it('has 4,160 cells', () => expect(TOTAL).toBe(4160))

  it('maps row and column to dates', () => {
    expect(cellDate('1990-06-15', 0, 0)).toBe('1990-06-15')
    expect(cellDate('1990-06-15', 0, 1)).toBe('1990-06-22')
    expect(cellDate('1990-06-15', 10, 0)).toBe(addYears('1990-06-15', 10))
    expect(cellDate('1990-06-15', 2, 3)).toBe(addWeeks(addYears('1990-06-15', 2), 3))
  })

  it('finds the current cell', () => {
    expect(currentCell('1990-06-15', '1990-06-15')).toBe(0)
    expect(currentCell('1990-06-15', '1990-06-21')).toBe(0)
    expect(currentCell('1990-06-15', '1990-06-22')).toBe(1)
    expect(currentCell('1990-06-15', '1991-06-15')).toBe(COLS)
    expect(currentCell('1990-06-15', '1980-01-01')).toBe(0)
    expect(currentCell('1990-06-15', '2200-01-01')).toBe(TOTAL - 1)
  })

  it('places each persona in its own age row', () => {
    for (const id of ['10', '30', '39', '65'] as const) {
      const life = personaLife(id, TODAY)
      const cur = currentCell(life.birthISO, TODAY)
      expect(Math.floor(cur / COLS)).toBe(Number(id))
      expect(cur % COLS).toBeGreaterThan(15)
      expect(cur % COLS).toBeLessThan(25)
    }
  })

  it('computes age in years', () => {
    expect(ageAt('2000-01-01', '2010-01-01')).toBeCloseTo(10, 1)
  })
})

describe('chapters', () => {
  const life = personaLife('39', TODAY)
  const cur = currentCell(life.birthISO, TODAY)

  it('labels cells by chapter', () => {
    const idx = chapterIndexForCells(life, TODAY)
    expect(idx[0]).toBe(0)
    expect(idx[18 * COLS + 5]).toBe(1)
    expect(idx[25 * COLS]).toBe(2)
    expect(idx[cur]).toBe(3)
    expect(idx[cur + 1]).toBe(-1)
  })

  it('finds the final past week of each ended chapter', () => {
    const last = lastWeekCells(life, TODAY)
    expect([...last.values()].sort()).toEqual([0, 1, 2])
    const idx = chapterIndexForCells(life, TODAY)
    for (const [cell, ch] of last) {
      expect(idx[cell]).toBe(ch)
      expect(idx[cell + 1]).not.toBe(ch)
    }
  })

  it('measures chapter lengths', () => {
    const w = chapterWeeks(life, TODAY)
    expect(w[2].weeks).toBeGreaterThan(515)
    expect(w[2].weeks).toBeLessThan(525)
  })
})
