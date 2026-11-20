export type TimelineMode = 'horizon' | 'birthFull' | 'birthRemaining'
export type Density = 'standard' | 'compact'
export type Highlight = 'all' | 'remaining' | 'events'
export type MarkerColor = 'lapis' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan'

export const MARKER_COLORS: { key: MarkerColor; hex: string; name: string }[] = [
  { key: 'lapis', hex: '#1D4ED8', name: 'Lapis' },
  { key: 'emerald', hex: '#047857', name: 'Emerald' },
  { key: 'amber', hex: '#B45309', name: 'Amber' },
  { key: 'rose', hex: '#BE123C', name: 'Rose' },
  { key: 'violet', hex: '#6D28D9', name: 'Violet' },
  { key: 'cyan', hex: '#0E7490', name: 'Cyan' },
]

export const colorHex = (c: MarkerColor): string =>
  MARKER_COLORS.find((m) => m.key === c)?.hex ?? MARKER_COLORS[0].hex

export interface Config {
  mode: TimelineMode
  /** Start date in horizon mode, birth date in both birth modes. */
  anchorDate: string
  /** Show the milestone callout rail beside the grid. */
  showLabels: boolean
  density: Density
  highlight: Highlight
}

export interface LifeEvent {
  id: string
  title: string
  start: string
  end: string
  color: MarkerColor
  note?: string
  visible: boolean
}

export interface Milestone {
  id: string
  title: string
  date: string
  visible: boolean
}

export interface Persisted {
  version: 1
  config: Config
  /** Absolute week ids (see weekId), so marks survive mode and anchor changes. */
  passedWeeks: number[]
  events: LifeEvent[]
  milestones: Milestone[]
}
