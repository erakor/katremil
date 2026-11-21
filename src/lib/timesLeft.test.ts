import { describe, expect, it } from 'vitest'
import { CADENCES, makePresets, nearestCadence, occurrences, summary } from './timesLeft'

describe('occurrences', () => {
  it('spaces cadence cells evenly inside each year', () => {
    const cells = occurrences({ startAge: 30 }, 4, 32)
    expect(cells).toHaveLength(8)
    expect(cells.slice(0, 4).map((c) => c - 30 * 52)).toEqual([6, 19, 32, 45])
  })

  it('stays inside the grid', () => {
    const cells = occurrences({ startAge: 0 }, 52, 200)
    expect(cells).toHaveLength(80 * 52)
    expect(Math.max(...cells)).toBeLessThan(4160)
  })

  it('is empty when the horizon is before the start', () => {
    expect(occurrences({ startAge: 40 }, 2, 30)).toEqual([])
  })
})

describe('presets and summary', () => {
  it('seeds the kid preset from the persona', () => {
    const kid = makePresets(33).find((p) => p.id === 'kid')!
    expect(kid.startAge).toBe(33)
    expect(kid.horizonAge).toBe(51)
  })

  it('counts past and future', () => {
    const [parents] = makePresets(33)
    const cells = occurrences(parents, 2, 60)
    const s = summary(cells, 39 * 52 + 20, parents.noun)
    expect(s.total).toBe(120)
    expect(s.past).toBe(79)
    expect(s.future).toBe(41)
    expect(s.pctBehind).toBeCloseTo(65.83, 1)
    expect(s.takeaway).toContain('41 visits')
  })

  it('handles none left', () => {
    expect(summary([10, 20], 100, 'trips').takeaway).toBe('No trips are left at this pace.')
  })

  it('snaps to a cadence step', () => {
    expect(CADENCES).toEqual([1, 2, 3, 4, 6, 12, 26, 52])
    expect(nearestCadence(5)).toBe(4)
    expect(nearestCadence(12)).toBe(12)
  })
})
