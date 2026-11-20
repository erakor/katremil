import {
  SOLAR_WEEKS_PER_YEAR,
  TOTAL_WEEKS,
  WEEKS_PER_ROW,
  WEEK_MS,
  addDays,
  isValidISO,
  mondayOf,
  parseISO,
  toISO,
  weekId,
  weeksBetween,
} from './dates'
import { colorHex } from './types'
import type { Config, Highlight, LifeEvent, Milestone, TimelineMode } from './types'

export interface Timeline {
  mode: TimelineMode
  today: string
  anchor: string
  startDate: string
  startMs: number
  total: number
  rows: number
  /** Weeks of life that precede the first grid week (remaining mode only). */
  elapsedBeforeStart: number
  startWeekId: number
  /** Raw index of the current week; may be negative or >= total. */
  todayIdx: number
}

export function buildTimeline(config: Config, today: string): Timeline {
  const anchor = isValidISO(config.anchorDate) ? config.anchorDate : today
  let startDate: string
  let elapsed = 0
  let total = TOTAL_WEEKS
  if (config.mode === 'horizon') {
    startDate = mondayOf(anchor)
  } else if (config.mode === 'birthFull') {
    startDate = mondayOf(anchor)
  } else {
    const birthMonday = mondayOf(anchor)
    elapsed = Math.min(TOTAL_WEEKS - 1, Math.max(0, weeksBetween(birthMonday, mondayOf(today))))
    startDate = toISO(parseISO(birthMonday) + elapsed * WEEK_MS)
    total = TOTAL_WEEKS - elapsed
  }
  const startMs = parseISO(startDate)
  return {
    mode: config.mode,
    today,
    anchor,
    startDate,
    startMs,
    total,
    rows: Math.ceil(total / WEEKS_PER_ROW),
    elapsedBeforeStart: elapsed,
    startWeekId: weekId(startDate),
    todayIdx: Math.floor((parseISO(today) - startMs) / WEEK_MS),
  }
}

export const inGrid = (tl: Timeline, i: number) => i >= 0 && i < tl.total
export const weekIndexForDate = (tl: Timeline, iso: string) =>
  Math.floor((parseISO(iso) - tl.startMs) / WEEK_MS)
export const weekStart = (tl: Timeline, i: number) => toISO(tl.startMs + i * WEEK_MS)
export const weekEnd = (tl: Timeline, i: number) => addDays(weekStart(tl, i), 6)
export const currentWeekIndex = (tl: Timeline) => (inGrid(tl, tl.todayIdx) ? tl.todayIdx : -1)

export function rowAge(tl: Timeline, row: number): number {
  return Math.floor(tl.elapsedBeforeStart / WEEKS_PER_ROW) + row
}

export function rowLabel(tl: Timeline, row: number): string {
  if (tl.mode === 'horizon') return `Yr ${row + 1}`
  const year = new Date(tl.startMs + row * WEEKS_PER_ROW * WEEK_MS).getUTCFullYear()
  return `Age ${rowAge(tl, row)} · ${year}`
}

export const yearsToWeeks = (y: number) => y * SOLAR_WEEKS_PER_YEAR

// ---------- events ----------

export interface EventIndex {
  /** For each week, indices into `events` of the visible events covering it. */
  byWeek: (number[] | undefined)[]
  mapped: number
  /** Per event id: weeks it covers inside the grid, and how many of those are passed. */
  perEvent: Record<string, { weeks: number; raw: number }>
}

/** Effective end date: ongoing events (no end) run through today, or their start if later. */
export function eventEnd(ev: { start: string; end?: string }, today: string): string {
  if (ev.end) return ev.end
  return today > ev.start ? today : ev.start
}

export function eventRawRange(tl: Timeline, ev: { start: string; end?: string }): [number, number] {
  return [weekIndexForDate(tl, ev.start), weekIndexForDate(tl, eventEnd(ev, tl.today))]
}

export function computeEventIndex(tl: Timeline, events: LifeEvent[]): EventIndex {
  const byWeek = Array.from<number[] | undefined>({ length: tl.total })
  const perEvent: EventIndex['perEvent'] = {}
  let mapped = 0
  events.forEach((ev, idx) => {
    const [a, b] = eventRawRange(tl, ev)
    const lo = Math.max(0, a)
    const hi = Math.min(tl.total - 1, b)
    perEvent[ev.id] = { weeks: Math.max(0, hi - lo + 1), raw: Math.max(0, b - a + 1) }
    if (!ev.visible) return
    for (let i = lo; i <= hi; i++) {
      const cur = byWeek[i]
      if (cur) cur.push(idx)
      else {
        byWeek[i] = [idx]
        mapped++
      }
    }
  })
  return { byWeek, mapped, perEvent }
}

// ---------- milestones ----------

export function milestoneStatus(tl: Timeline, m: Milestone, passed: ReadonlySet<number>) {
  const idx = weekIndexForDate(tl, m.date)
  const onGrid = inGrid(tl, idx)
  const reached = m.date <= tl.today || (onGrid && passed.has(tl.startWeekId + idx))
  return { idx, onGrid, reached }
}

export function computeMilestoneIndex(
  tl: Timeline,
  milestones: Milestone[],
): Map<number, Milestone[]> {
  const map = new Map<number, Milestone[]>()
  for (const m of milestones) {
    if (!m.visible) continue
    const idx = weekIndexForDate(tl, m.date)
    if (!inGrid(tl, idx)) continue
    const list = map.get(idx)
    if (list) list.push(m)
    else map.set(idx, [m])
  }
  return map
}

// ---------- grid rows ----------

export interface CellData {
  passed: boolean
  colors: string[]
  dim: boolean
  ms: boolean
  current: boolean
}

export interface RowData {
  index: number
  /** Changes only when something visible in this row changes. */
  sig: string
  cells: CellData[]
  label: string
  rail: string
}

export interface GridOptions {
  highlight: Highlight
  focusEventId: string | null
}

export function buildRows(
  tl: Timeline,
  passed: ReadonlySet<number>,
  evIdx: EventIndex,
  msIdx: Map<number, Milestone[]>,
  events: LifeEvent[],
  opts: GridOptions,
): { rows: RowData[]; passedCount: number } {
  const rows: RowData[] = []
  const cur = currentWeekIndex(tl)
  let passedCount = 0
  const focusIdx = opts.focusEventId ? events.findIndex((e) => e.id === opts.focusEventId) : -1
  for (let r = 0; r < tl.rows; r++) {
    const cells: CellData[] = []
    let sig = ''
    const rail: string[] = []
    const from = r * WEEKS_PER_ROW
    const to = Math.min(tl.total, from + WEEKS_PER_ROW)
    for (let i = from; i < to; i++) {
      const isPassed = passed.has(tl.startWeekId + i)
      if (isPassed) passedCount++
      const evs = evIdx.byWeek[i]
      const colors = evs ? evs.map((k) => colorHex(events[k].color)) : []
      const ms = msIdx.get(i)
      if (ms) for (const m of ms) rail.push(m.title)
      let dim = false
      if (opts.highlight === 'remaining' && isPassed) dim = true
      if (opts.highlight === 'events' && !colors.length) dim = true
      if (focusIdx >= 0 && !(evs && evs.includes(focusIdx))) dim = true
      const cell: CellData = { passed: isPassed, colors, dim, ms: !!ms, current: i === cur }
      cells.push(cell)
      sig += `${isPassed ? 1 : 0}${dim ? 1 : 0}${ms ? 1 : 0}${cell.current ? 1 : 0}${colors.join('')};`
    }
    const label = rowLabel(tl, r)
    const railText = rail.join(' · ')
    rows.push({ index: r, sig: `${label}|${railText}|${sig}`, cells, label, rail: railText })
  }
  return { rows, passedCount }
}

// ---------- analytics ----------

export interface Group {
  key: number
  label: string
  startIdx: number
  endIdx: number
  active: number
  peak: number
}

export function aggregate(tl: Timeline, evIdx: EventIndex, by: 'year' | 'decade'): Group[] {
  const size = by === 'year' ? WEEKS_PER_ROW : WEEKS_PER_ROW * 10
  const out: Group[] = []
  const n = Math.ceil(tl.total / size)
  for (let g = 0; g < n; g++) {
    const startIdx = g * size
    const endIdx = Math.min(tl.total, startIdx + size) - 1
    let active = 0
    let peak = 0
    for (let i = startIdx; i <= endIdx; i++) {
      const c = evIdx.byWeek[i]?.length ?? 0
      if (c > 0) active++
      if (c > peak) peak = c
    }
    let label: string
    if (tl.mode === 'horizon') {
      label = by === 'year' ? `Yr ${g + 1}` : `Yr ${g * 10 + 1}-${g * 10 + 10}`
    } else {
      const base = Math.floor(tl.elapsedBeforeStart / WEEKS_PER_ROW)
      label = by === 'year' ? `${base + g}` : `${base + g * 10}-${base + g * 10 + 9}`
    }
    out.push({ key: g, label, startIdx, endIdx, active, peak })
  }
  return out
}
