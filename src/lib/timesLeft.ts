import { fmtInt } from './dates'
import { COLS, TOTAL } from './life'

export interface Preset {
  id: string
  label: string
  noun: string
  startAge: number
  perYear: number
  horizonAge: number
}

export const CADENCES = [1, 2, 3, 4, 6, 12, 26, 52]

/** `kidBornAge` is the viewer's age when their child was born. */
export function makePresets(kidBornAge: number): Preset[] {
  return [
    {
      id: 'parents',
      label: 'Visits with parents',
      noun: 'visits',
      startAge: 0,
      perYear: 2,
      horizonAge: 60,
    },
    {
      id: 'kid',
      label: 'Summers with my kid at home',
      noun: 'summers',
      startAge: kidBornAge,
      perYear: 1,
      horizonAge: kidBornAge + 18,
    },
    { id: 'beach', label: 'Beach trips', noun: 'trips', startAge: 0, perYear: 1, horizonAge: 80 },
    {
      id: 'friend',
      label: 'Dinners with an old friend',
      noun: 'dinners',
      startAge: 0,
      perYear: 4,
      horizonAge: 80,
    },
    { id: 'books', label: 'Books read', noun: 'books', startAge: 6, perYear: 12, horizonAge: 80 },
  ]
}

export function nearestCadence(perYear: number): number {
  return CADENCES.reduce((a, b) => (Math.abs(b - perYear) < Math.abs(a - perYear) ? b : a))
}

/** Cell indices, evenly spaced inside each year from startAge up to horizonAge. */
export function occurrences(
  preset: Pick<Preset, 'startAge'>,
  cadence: number,
  horizonAge: number,
): number[] {
  const out: number[] = []
  const first = Math.max(0, Math.round(preset.startAge))
  const last = Math.min(80, Math.round(horizonAge))
  for (let year = first; year < last; year++) {
    for (let k = 0; k < cadence; k++) {
      const cell = year * COLS + Math.floor(((k + 0.5) * COLS) / cadence)
      if (cell < TOTAL) out.push(cell)
    }
  }
  return out
}

export interface TimesSummary {
  past: number
  future: number
  total: number
  pctBehind: number
  takeaway: string
}

export function summary(cells: number[], current: number, noun: string): TimesSummary {
  const past = cells.filter((c) => c <= current).length
  const total = cells.length
  const future = total - past
  const pctBehind = total === 0 ? 0 : (past / total) * 100
  const takeaway =
    total === 0
      ? 'Nothing is counted at this setting.'
      : future === 0
        ? `No ${noun} are left at this pace.`
        : `About ${fmtInt(future)} ${noun} left, if the pace holds.`
  return { past, future, total, pctBehind, takeaway }
}
