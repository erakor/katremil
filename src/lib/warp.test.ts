import { describe, expect, it } from 'vitest'
import { ROWS, TOTAL } from './life'
import { feltShare, rowAtY, rowOffsets, rowWeights } from './warp'

const sum = (a: ArrayLike<number>) => Array.from(a).reduce((x, y) => x + y, 0)

describe('rowWeights', () => {
  it.each([0, 0.3, 0.5, 1])('sums to 1 at t=%s', (t) => {
    expect(sum(rowWeights(t))).toBeCloseTo(1, 10)
  })

  it('is uniform on the clock', () => {
    const w = rowWeights(0)
    expect(w[0]).toBeCloseTo(1 / ROWS, 12)
    expect(w[79]).toBeCloseTo(1 / ROWS, 12)
  })

  it('never grows with age when felt', () => {
    const w = rowWeights(1)
    for (let a = 1; a < ROWS; a++) expect(w[a]).toBeLessThanOrEqual(w[a - 1] + 1e-12)
  })

  it('clamps infancy and keeps the oldest row drawable', () => {
    const w = rowWeights(1)
    expect(w[0]).toBeCloseTo(w[3], 12)
    expect(w[4]).toBeLessThan(w[3])
    expect(w[79]).toBeGreaterThan(0.15 / ROWS)
  })

  it('shrinks the oldest rows as t grows', () => {
    expect(rowWeights(1)[79]).toBeLessThan(rowWeights(0.5)[79])
    expect(rowWeights(0.5)[79]).toBeLessThan(rowWeights(0)[79])
  })
})

describe('rowOffsets', () => {
  it('spans the height monotonically', () => {
    const o = rowOffsets(0.7, 800)
    expect(o).toHaveLength(81)
    expect(o[0]).toBe(0)
    expect(o[80]).toBe(800)
    for (let i = 1; i <= 80; i++) expect(o[i]).toBeGreaterThan(o[i - 1])
  })

  it('finds the row at y', () => {
    const o = rowOffsets(1, 800)
    expect(rowAtY(o, 0)).toBe(0)
    expect(rowAtY(o, 799.9)).toBe(79)
    expect(rowAtY(o, o[40] + 0.01)).toBe(40)
  })
})

describe('feltShare', () => {
  it('covers the whole grid', () => expect(feltShare(0, TOTAL)).toBeCloseTo(1, 10))
  it('weights early weeks more than late ones', () => {
    expect(feltShare(0, 52)).toBeGreaterThan(feltShare(52 * 60, 52))
  })
})
