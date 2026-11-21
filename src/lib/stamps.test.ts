import { describe, expect, it } from 'vitest'
import { STAMPS, stampMath } from './stamps'

describe('stampMath', () => {
  it('matches the brief for a 10-week summer', () => {
    expect(stampMath(10 * 52, 10, 39 * 52).pctOfLifeAtAge).toBeCloseTo(1.9, 1)
    expect(stampMath(39 * 52, 10, 39 * 52).pctOfLifeAtAge).toBeCloseTo(0.49, 2)
  })

  it('reports shares of the grid and of life so far', () => {
    const m = stampMath(39 * 52, 208, 39 * 52 + 20)
    expect(m.pctOfGrid).toBeCloseTo((208 / 4160) * 100, 6)
    expect(m.pctOfLifeToday).toBeCloseTo((208 / 2048) * 100, 6)
  })

  it('clips at the last row', () => {
    expect(stampMath(4160 - 5, 936, 100).cells).toBe(5)
  })

  it('shows the felt share larger for early anchors', () => {
    expect(stampMath(0, 208, 100).felt).toBeGreaterThan(stampMath(52 * 50, 208, 100).felt)
  })

  it('compares to a chapter of similar length, else to summers', () => {
    const near = stampMath(0, 520, 100, [{ label: 'Living abroad', weeks: 520 }])
    expect(near.equivalence).toContain('Living abroad')
    expect(stampMath(0, 936, 100).equivalence).toBe('roughly 72 summers')
    expect(stampMath(0, 10, 100).equivalence).toBe('about one summer')
  })

  it('offers the five chips from the brief', () => {
    expect(STAMPS.map((s) => s.weeks)).toEqual([10, 208, 312, 936, 676])
  })
})
