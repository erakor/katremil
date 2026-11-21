import { describe, expect, it } from 'vitest'
import { SLEEP_FRAC, WORK_FRAC, awakeUnclaimedWeeks } from './xray'

describe('xray', () => {
  it('uses a third for sleep and 40 of 168 hours for work', () => {
    expect(SLEEP_FRAC).toBeCloseTo(1 / 3, 10)
    expect(WORK_FRAC).toBeCloseTo(40 / 168, 10)
  })

  it('splits the weeks ahead', () => {
    const u = awakeUnclaimedWeeks(39 * 52)
    expect(u.remaining).toBe(4160 - 39 * 52 - 1)
    expect(u.sleep).toBeCloseTo(u.remaining / 3, 6)
    expect(u.work).toBeCloseTo((22 * 52 + 51) * WORK_FRAC, 6) // rest of row 39, rows 40..61
    expect(u.free).toBeCloseTo(u.remaining - u.sleep - u.work, 6)
  })

  it('respects the flags', () => {
    const u = awakeUnclaimedWeeks(0, { sleep: false, work: false })
    expect(u.free).toBe(u.remaining)
  })
})
