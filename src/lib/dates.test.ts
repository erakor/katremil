import { describe, expect, it } from 'vitest'
import * as d from './dates'

describe('isValidISO', () => {
  it('accepts real calendar dates', () => {
    expect(d.isValidISO('2024-02-29')).toBe(true)
  })
  it.each(['2023-02-29', '2024-13-01', '2024-1-01', '', 20240101, null])('rejects %s', (v) => {
    expect(d.isValidISO(v)).toBe(false)
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
