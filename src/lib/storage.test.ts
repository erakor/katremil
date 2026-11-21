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
    ['end before start', { ...good, chapters: [{ ...good.chapters[0], endISO: '1980-01-01' }] }],
    ['dup ids', { ...good, chapters: [good.chapters[0], good.chapters[0]] }],
    ['missing label', { ...good, chapters: [{ ...good.chapters[0], label: 3 }] }],
  ])('rejects %s', (_, raw) => expect(validateLife(raw)).toBeNull())

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

  it('ignores the old v1 key and corrupt data', () => {
    vi.stubGlobal('localStorage', fake)
    store.set('ftw:v1', JSON.stringify(good))
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
