import { isValidISO } from './dates'
import { MARKER_COLORS } from './types'
import type { Config, LifeEvent, Milestone, Persisted } from './types'

export const STORAGE_KEY = 'ftw:v1'

const MODES = ['horizon', 'birthFull', 'birthRemaining']
const DENSITIES = ['standard', 'compact']
const HIGHLIGHTS = ['all', 'remaining', 'events']
const COLOR_KEYS = MARKER_COLORS.map((c) => c.key as string)

type Result = { ok: true; data: Persisted } | { ok: false; error: string }

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function validate(raw: unknown): Result {
  if (!isObj(raw)) return { ok: false, error: 'File is not a ledger export.' }
  if (raw.version !== 1) return { ok: false, error: 'Unsupported ledger version.' }
  const c = raw.config
  if (!isObj(c)) return { ok: false, error: 'Missing config.' }
  if (!MODES.includes(c.mode as string)) return { ok: false, error: 'Invalid timeline mode.' }
  if (!isValidISO(c.anchorDate)) return { ok: false, error: 'Invalid anchor date.' }
  if (typeof c.showLabels !== 'boolean') return { ok: false, error: 'Invalid showLabels.' }
  if (!DENSITIES.includes(c.density as string)) return { ok: false, error: 'Invalid density.' }
  if (!HIGHLIGHTS.includes(c.highlight as string)) return { ok: false, error: 'Invalid highlight.' }
  const config = c as unknown as Config

  if (!Array.isArray(raw.passedWeeks) || raw.passedWeeks.length > 20000)
    return { ok: false, error: 'Invalid passed weeks.' }
  for (const n of raw.passedWeeks) {
    if (!Number.isInteger(n) || Math.abs(n as number) > 100000)
      return { ok: false, error: 'Invalid passed week value.' }
  }

  if (!Array.isArray(raw.events) || raw.events.length > 1000)
    return { ok: false, error: 'Invalid events list.' }
  const events: LifeEvent[] = []
  for (const e of raw.events) {
    if (
      !isObj(e) ||
      typeof e.id !== 'string' ||
      typeof e.title !== 'string' ||
      !isValidISO(e.start) ||
      !isValidISO(e.end) ||
      e.end < e.start ||
      !COLOR_KEYS.includes(e.color as string) ||
      typeof e.visible !== 'boolean' ||
      (e.note !== undefined && typeof e.note !== 'string')
    ) {
      return { ok: false, error: 'An event has an invalid shape.' }
    }
    events.push({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      color: e.color as LifeEvent['color'],
      note: e.note as string | undefined,
      visible: e.visible,
    })
  }

  if (new Set(events.map((e) => e.id)).size !== events.length)
    return { ok: false, error: 'Two events share an id.' }

  if (!Array.isArray(raw.milestones) || raw.milestones.length > 1000)
    return { ok: false, error: 'Invalid milestones list.' }
  const milestones: Milestone[] = []
  for (const m of raw.milestones) {
    if (
      !isObj(m) ||
      typeof m.id !== 'string' ||
      typeof m.title !== 'string' ||
      !isValidISO(m.date) ||
      typeof m.visible !== 'boolean'
    ) {
      return { ok: false, error: 'A milestone has an invalid shape.' }
    }
    milestones.push({ id: m.id, title: m.title, date: m.date, visible: m.visible })
  }

  if (new Set(milestones.map((m) => m.id)).size !== milestones.length)
    return { ok: false, error: 'Two milestones share an id.' }

  return {
    ok: true,
    data: {
      version: 1,
      config: {
        mode: config.mode,
        anchorDate: config.anchorDate,
        showLabels: config.showLabels,
        density: config.density,
        highlight: config.highlight,
      },
      passedWeeks: [...(raw.passedWeeks as number[])].sort((a, b) => a - b),
      events,
      milestones,
    },
  }
}

export function loadState(): Persisted | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) return null
    const res = validate(JSON.parse(text))
    return res.ok ? res.data : null
  } catch {
    return null
  }
}

export function saveState(p: Persisted): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* storage unavailable or full: the app keeps working in memory */
  }
}

export function exportState(p: Persisted, today: string): void {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `four-thousand-weeks-${today}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function readImportFile(file: File): Promise<Result> {
  try {
    const text = await file.text()
    return validate(JSON.parse(text))
  } catch {
    return { ok: false, error: 'Could not read that file as JSON.' }
  }
}
