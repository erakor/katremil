import { describe, expect, it } from 'vitest'
import { validate } from './storage'

const good = () => ({
  version: 1,
  config: {
    mode: 'horizon',
    anchorDate: '2026-01-05',
    showLabels: true,
    density: 'standard',
    highlight: 'all',
  },
  passedWeeks: [3, 1, 2],
  events: [
    {
      id: 'e1',
      title: 'Sprint',
      start: '2026-01-05',
      end: '2026-04-04',
      color: 'lapis',
      visible: true,
    },
  ],
  milestones: [{ id: 'm1', title: 'Launch', date: '2026-06-01', visible: true }],
})

describe('validate', () => {
  it('accepts a well-formed export and sorts passed weeks', () => {
    const res = validate(good())
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.data.passedWeeks).toEqual([1, 2, 3])
  })

  it('drops unknown fields', () => {
    const raw = good() as Record<string, unknown>
    ;(raw.events as Record<string, unknown>[])[0].extra = 'x'
    const res = validate(raw)
    expect(res.ok && 'extra' in res.data.events[0]).toBe(false)
  })

  it.each([
    ['not an object', () => 'nope'],
    ['wrong version', () => ({ ...good(), version: 2 })],
    ['bad mode', () => ({ ...good(), config: { ...good().config, mode: 'x' } })],
    ['bad anchor', () => ({ ...good(), config: { ...good().config, anchorDate: '2026-02-30' } })],
    ['fractional week', () => ({ ...good(), passedWeeks: [1.5] })],
    [
      'event ending before it starts',
      () => {
        const g = good()
        g.events[0].end = '2025-01-01'
        return g
      },
    ],
    [
      'unknown color',
      () => {
        const g = good()
        g.events[0].color = 'teal'
        return g
      },
    ],
    [
      'duplicate event ids',
      () => {
        const g = good()
        g.events.push({ ...g.events[0] })
        return g
      },
    ],
    [
      'duplicate milestone ids',
      () => {
        const g = good()
        g.milestones.push({ ...g.milestones[0] })
        return g
      },
    ],
  ])('rejects %s', (_, make) => {
    expect(validate(make()).ok).toBe(false)
  })
})
