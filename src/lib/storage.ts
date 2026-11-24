import { isValidISO } from './dates'
import type { Chapter, Life } from './life'
import { isPigmentKey } from './pigments'
import type { PigmentKey } from './pigments'

// Only a custom life is ever saved. Sample personas are derived from today and never stored.
// An old ledger (`ftw:v1`) is migrated on first load when no v2 life exists yet.
export const STORAGE_KEY = 'ftw:v2'
const LEGACY_KEY = 'ftw:v1'

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
    if (c.endISO !== undefined && !isValidISO(c.endISO)) return null
    // An end before the start drops that one chapter rather than the whole life.
    if (c.endISO !== undefined && c.endISO < c.startISO) continue
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
    const text = readRaw()
    if (text) return validateLife(JSON.parse(text))
    const legacy = localStorage.getItem(LEGACY_KEY)
    return legacy ? migrateV1(JSON.parse(legacy)) : null
  } catch {
    return null
  }
}

const LEGACY_COLORS: Record<string, PigmentKey> = {
  lapis: 'slate',
  emerald: 'sage',
  amber: 'ochre',
  rose: 'terracotta',
  violet: 'plum',
  cyan: 'teal',
}

/**
 * Brings an old ledger forward: its birth date and events become a custom life. Only the
 * birth modes carry a birth date; a horizon-mode ledger has none to map, so it is skipped.
 * The v1 entry itself is left in place.
 */
function migrateV1(raw: unknown): Life | null {
  if (!isObj(raw) || raw.version !== 1 || !isObj(raw.config) || !Array.isArray(raw.events))
    return null
  const { mode, anchorDate } = raw.config
  if (mode !== 'birthFull' && mode !== 'birthRemaining') return null
  const chapters = raw.events
    .filter(isObj)
    .slice(0, MAX_CHAPTERS)
    .map((e) => ({
      id: e.id,
      label: typeof e.title === 'string' ? e.title.slice(0, 80) : e.title,
      startISO: e.start,
      endISO: e.end,
      pigment: LEGACY_COLORS[e.color as string] ?? 'slate',
    }))
  return validateLife({ birthISO: anchorDate, chapters })
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

const INTRO_KEY = 'ftw:intro'

/** Whether the opening note has been dismissed before. Storage failures read as "not seen". */
export function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

export function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* the note simply shows again next visit */
  }
}
