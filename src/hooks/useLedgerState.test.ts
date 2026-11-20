import { describe, expect, it } from 'vitest'
import { weekId } from '@/lib/dates'
import { initial, reducer, toPersisted } from './useLedgerState'
import type { LedgerState } from './useLedgerState'

const TODAY = '2026-11-20'
const hydrated = (): LedgerState => reducer(initial, { type: 'HYDRATE', today: TODAY, data: null })

describe('reducer', () => {
  it('hydrates with no saved data by anchoring on today', () => {
    const s = hydrated()
    expect(s.hydrated).toBe(true)
    expect(s.config.anchorDate).toBe(TODAY)
  })

  it('fills elapsed weeks when switching to birthFull with nothing marked', () => {
    let s = reducer(hydrated(), { type: 'SET_ANCHOR', date: '2026-01-05' })
    s = reducer(s, { type: 'SET_MODE', mode: 'birthFull' })
    const ids = [...s.passedWeeks].sort((a, b) => a - b)
    expect(ids[0]).toBe(weekId('2026-01-05'))
    expect(ids.at(-1)).toBe(weekId(TODAY) - 1)
  })

  it('keeps existing marks when switching to birthFull', () => {
    let s = reducer(hydrated(), { type: 'SET_WEEKS', ids: [42], value: true })
    s = reducer(s, { type: 'SET_MODE', mode: 'birthFull' })
    expect([...s.passedWeeks]).toEqual([42])
  })

  it('returns the same state when SET_WEEKS changes nothing', () => {
    const s = hydrated()
    expect(reducer(s, { type: 'SET_WEEKS', ids: [1], value: false })).toBe(s)
  })

  it('round-trips through toPersisted and IMPORT', () => {
    let s = reducer(hydrated(), { type: 'SET_WEEKS', ids: [5, 3], value: true })
    s = reducer(s, {
      type: 'ADD_MILESTONE',
      milestone: { id: 'm', title: 'M', date: TODAY, visible: true },
    })
    const saved = toPersisted(s)
    expect(saved.passedWeeks).toEqual([3, 5])
    const restored = reducer(hydrated(), { type: 'IMPORT', data: saved })
    expect(toPersisted(restored)).toEqual(saved)
  })

  it('updates and deletes events by id', () => {
    const ev = {
      id: 'a',
      title: 'A',
      start: TODAY,
      end: TODAY,
      color: 'lapis' as const,
      visible: true,
    }
    let s = reducer(hydrated(), { type: 'ADD_EVENT', event: ev })
    s = reducer(s, { type: 'UPDATE_EVENT', id: 'a', patch: { title: 'B' } })
    expect(s.events[0].title).toBe('B')
    s = reducer(s, { type: 'DELETE_EVENT', id: 'a' })
    expect(s.events).toEqual([])
  })
})
