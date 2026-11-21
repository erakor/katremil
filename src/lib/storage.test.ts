import { afterEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, loadCustom, saveCustom, validateLife } from './storage'

const good = {
  birthISO: '1990-06-15',
  chapters: [
    { id: 'a', label: 'One', startISO: '1990-06-15', endISO: '2000-01-01', pigment: 'sage' },
    { id: 'b', label: 'Two', startISO: '2000-01-02', pigment: 'plum' },
  ],
}

describe('validateLife', () => {
  it('accepts a good life', () => expect(validateLife(good)).toEqual(good))

  it.each([
    ['null', null],
    ['array', []],
    ['bad birth', { ...good, birthISO: '1990-13-01' }],
    ['chapters not array', { ...good, chapters: 'x' }],
    ['bad pigment', { ...good, chapters: [{ ...good.chapters[0], pigment: 'neon' }] }],
    ['dup ids', { ...good, chapters: [good.chapters[0], good.chapters[0]] }],
    ['missing label', { ...good, chapters: [{ ...good.chapters[0], label: 3 }] }],
  ])('rejects %s', (_, raw) => expect(validateLife(raw)).toBeNull())

  it('drops only the chapter whose end precedes its start', () => {
    const bad = { ...good.chapters[0], id: 'z', endISO: '1980-01-01' }
    expect(validateLife({ ...good, chapters: [...good.chapters, bad] })).toEqual(good)
  })

  it('drops unknown fields', () => {
    const v = validateLife({ ...good, extra: 1 })
    expect(v).not.toHaveProperty('extra')
  })
})

describe('load and save', () => {
  const store = new Map<string, string>()
  const fake = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  }
  afterEach(() => {
    store.clear()
    vi.unstubAllGlobals()
  })

  it('round-trips under ftw:v2', () => {
    vi.stubGlobal('localStorage', fake)
    saveCustom(good as never)
    expect(STORAGE_KEY).toBe('ftw:v2')
    expect(loadCustom()).toEqual(good)
  })

  it('migrates a birth-mode v1 ledger, skips other v1 data, and rejects corrupt data', () => {
    vi.stubGlobal('localStorage', fake)
    store.set('ftw:v1', JSON.stringify(good))
    expect(loadCustom()).toBeNull()
    const v1 = {
      version: 1,
      config: { mode: 'birthFull', anchorDate: '1990-06-15' },
      passedWeeks: [],
      events: [
        {
          id: 'e',
          title: 'School',
          start: '1996-09-01',
          end: '2008-06-30',
          color: 'emerald',
          visible: true,
        },
      ],
      milestones: [],
    }
    store.set('ftw:v1', JSON.stringify(v1))
    expect(loadCustom()).toEqual({
      birthISO: '1990-06-15',
      chapters: [
        { id: 'e', label: 'School', startISO: '1996-09-01', endISO: '2008-06-30', pigment: 'sage' },
      ],
    })
    store.set(
      'ftw:v1',
      JSON.stringify({ ...v1, config: { mode: 'horizon', anchorDate: '2020-01-06' } }),
    )
    expect(loadCustom()).toBeNull()
    store.set(STORAGE_KEY, '{nope')
    expect(loadCustom()).toBeNull()
  })

  it('survives storage that throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(loadCustom()).toBeNull()
    expect(() => saveCustom(good as never)).not.toThrow()
  })
})
