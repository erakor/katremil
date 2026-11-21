import { fmtInt, formatDate } from './dates'
import { COLS, TOTAL, cellDateAt, colOf, rowOf } from './life'
import type { Chapter } from './life'
import type { StampMath } from './stamps'
import { FROSTED_ROWS, awakeUnclaimedWeeks } from './xray'
import type { XrayFlags } from './xray'

export interface Readout {
  lead: string
  detail: string
}

export interface ReadoutInput {
  lens: 'chapters' | 'times'
  birthISO: string
  current: number
  chapters: Chapter[]
  chapterIdx: Int16Array
  /** Cell -> index of the chapter it closed. */
  lastWeeks: Map<number, number>
  xray: XrayFlags
  hoverCell: number | null
  stamp: { label: string; weeks: number; anchor: number; math: StampMath } | null
  times: { label: string; takeaway: string; past: number; future: number } | null
}

const pct = (n: number) => (n >= 10 ? n.toFixed(0) : n >= 1 ? n.toFixed(1) : n.toFixed(2))

function stampCopy(s: NonNullable<ReadoutInput['stamp']>): Readout {
  const age = rowOf(s.anchor)
  return {
    lead: `${s.label}, placed at ${age}, is ${pct(s.math.pctOfLifeAtAge)}% of the life you would have lived by then.`,
    detail: `${fmtInt(s.math.cells)} wk · ${pct(s.math.pctOfGrid)}% of the grid · ${pct(s.math.pctOfLifeToday)}% of your life so far · feels like ${pct(s.math.felt)}% · ${s.math.equivalence}`,
  }
}

function hoverCopy(i: ReadoutInput, cell: number): Readout {
  const date = formatDate(cellDateAt(i.birthISO, cell))
  const ci = i.chapterIdx[cell]
  const chapter = ci >= 0 ? i.chapters[ci].label : null
  const where = `Age ${rowOf(cell)}, week ${colOf(cell) + 1}`
  if (cell < i.current) {
    return {
      lead: chapter ? `A week of “${chapter}”.` : 'A week before you were keeping track.',
      detail: `${where} · ${date} · behind you`,
    }
  }
  if (cell === i.current) {
    return { lead: 'This is the week you are in.', detail: `${where} · ${date} · now` }
  }
  return {
    lead: 'A week that has not happened yet.',
    detail: `${where} · ${date} · ${fmtInt(cell - i.current)} wk from now`,
  }
}

function xrayCopy(i: ReadoutInput): Readout | null {
  const { sleep, work, forgotten } = i.xray
  if (!sleep && !work && !forgotten) return null
  if (sleep || work) {
    const u = awakeUnclaimedWeeks(i.current, { sleep, work })
    const parts: string[] = []
    if (sleep) parts.push(`${fmtInt(u.sleep)} asleep`)
    if (work) parts.push(`${fmtInt(u.work)} at work`)
    return {
      lead: `Of the weeks ahead, about ${fmtInt(u.free)} are awake and unclaimed.`,
      detail: `${fmtInt(u.remaining)} wk ahead · ${parts.join(' · ')}`,
    }
  }
  return {
    lead: 'The first few years are mostly gone from memory.',
    detail: `${fmtInt(FROSTED_ROWS * COLS)} wk · ${pct(((FROSTED_ROWS * COLS) / TOTAL) * 100)}% of the grid`,
  }
}

/** One place for all microcopy. Priority: stamp > last-time cell > hovered cell > x-ray > lens. */
export function readout(i: ReadoutInput): Readout {
  if (i.stamp && i.stamp.math.cells > 0) return stampCopy(i.stamp)

  if (i.hoverCell !== null) {
    const last = i.lastWeeks.get(i.hoverCell)
    if (last !== undefined) {
      const ch = i.chapters[last]
      return {
        lead: `The last week of “${ch.label}”.`,
        detail: `${formatDate(cellDateAt(i.birthISO, i.hoverCell))} · nobody announced it`,
      }
    }
    return hoverCopy(i, i.hoverCell)
  }

  if (i.lens === 'times' && i.times) {
    return {
      lead: i.times.takeaway,
      detail: `${i.times.label} · ${fmtInt(i.times.past)} behind · ${fmtInt(i.times.future)} ahead`,
    }
  }

  const x = xrayCopy(i)
  if (x) return x

  const ahead = TOTAL - 1 - i.current
  return {
    lead: 'Every square is one week. This is all of them.',
    detail: `${fmtInt(i.current)} behind you · ${fmtInt(ahead)} ahead, give or take`,
  }
}
