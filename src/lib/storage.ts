import { isValidISO } from './dates'
import type { Chapter, Life } from './life'
import { isPigmentKey } from './pigments'

// Only a custom life is ever saved. Sample personas are derived from today and never stored.
// The old ledger format (`ftw:v1`) is deliberately ignored.
export const STORAGE_KEY = 'ftw:v2'

const MAX_CHAPTERS = 40

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Returns a clean Life, or null if the input is not a valid saved life. */
export function validateLife(raw: unknown): Life | null {
  if (!isObj(raw) || !isValidISO(raw.birthISO)) return null
  if (!Array.isArray(raw.chapters) || raw.chapters.length > MAX_CHAPTERS) return null
  const chapters: Chapter[] = []
  for (const c of raw.chapters) {
    if (
      !isObj(c) ||
      typeof c.id !== 'string' ||
      typeof c.label !== 'string' ||
      c.label.length > 80 ||
      !isValidISO(c.startISO) ||
      !isPigmentKey(c.pigment)
    )
      return null
    if (c.endISO !== undefined && (!isValidISO(c.endISO) || c.endISO < c.startISO)) return null
    chapters.push({
      id: c.id,
      label: c.label,
      startISO: c.startISO,
      endISO: c.endISO,
      pigment: c.pigment,
    })
  }
  if (new Set(chapters.map((c) => c.id)).size !== chapters.length) return null
  return { birthISO: raw.birthISO, chapters }
}

export function loadCustom(): Life | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    return text ? validateLife(JSON.parse(text)) : null
  } catch {
    return null
  }
}

export function saveCustom(life: Life): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(life))
  } catch {
    /* storage unavailable or full: the app keeps working in memory */
  }
}

export function clearCustom(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nothing to clear */
  }
}

export function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}
