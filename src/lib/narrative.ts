import type { ChapterShare } from './chapterShare'
import { addYears, daysBetween, fmtInt, formatDate } from './dates'
import { COLS, ROWS, TOTAL, cellDateAt, colOf, rowOf } from './life'
import type { Chapter } from './life'
import type { StampMath } from './stamps'
import { elapsedPct, formatPct, formatSpan, markAt, nextMark } from './milestones'
import type { Mark, RemainingUnit } from './milestones'
import { FROSTED_ROWS, awakeUnclaimedWeeks } from './xray'
import type { XrayFlags } from './xray'

export interface Readout {
  lead: string
  detail: string
  /** A large number shown beside the lead (the opening readout only). */
  figure?: string
  /** Time left, in the chosen unit. The view renders it as a button that cycles the unit. */
  remaining?: string
  /** How the hovered chapter's share of your life changes (past chapter weeks only). */
  share?: string
}

export interface ReadoutInput {
  lens: 'chapters' | 'times'
  birthISO: string
  current: number
  chapters: Chapter[]
  chapterIdx: Int16Array
  /** Cell -> index of the chapter it closed. */
  lastWeeks: Map<number, number>
  /** chapterShare for each chapter, in the same order (null before a chapter starts). */
  shares: (ChapterShare | null)[]
  xray: XrayFlags
  hoverCell: number | null
  stamp: { label: string; weeks: number; anchor: number; math: StampMath } | null
  times: { label: string; takeaway: string; past: number; future: number } | null
  unit: RemainingUnit
  /** The 1,000-week marks for this birth date (see marksFor). */
  marks: Mark[]
}

const pct = (n: number) => (n >= 10 ? n.toFixed(0) : n >= 1 ? n.toFixed(1) : n.toFixed(2))

/** `46% of your life now · 30% at 60 · 22% at 80`; compact drops "of your life". */
export function shareLine(s: ChapterShare, compact = false): string {
  const parts = [compact ? `${pct(s.now)}% now` : `${pct(s.now)}% of your life now`]
  s.projections.forEach((p, k) => {
    // A chapter still running is projected on the assumption that it keeps going. Say so.
    const lead = k === 0 && s.grows ? 'if it continues, ' : ''
    parts.push(`${lead}${pct(p.pct)}% at ${p.age}`)
  })
  return parts.join(' · ')
}

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
  const shareOf = ci >= 0 && cell < i.current ? i.shares[ci] : null
  const share = shareOf ? { share: shareLine(shareOf) } : {}
  const mark = markAt(i.marks, cell)
  if (mark !== null) {
    const n = fmtInt(mark.week)
    const markDate = formatDate(mark.dateISO)
    const lead =
      cell < i.current
        ? `You passed the ${n}-week mark on ${markDate}.`
        : cell === i.current
          ? `You are standing on the ${n}-week mark.`
          : `The ${n}-week mark arrives on ${markDate}.`
    const of = chapter && cell <= i.current ? ` · “${chapter}”` : ''
    const away = cell > i.current ? ` · ${fmtInt(cell - i.current)} wk from now` : ''
    return { lead, detail: `Week ${n} · ${where}${of}${away}`, ...share }
  }
  if (cell < i.current) {
    return {
      lead: chapter ? `A week of “${chapter}”.` : 'A week before you were keeping track.',
      detail: `${where} · ${date} · behind you`,
      ...share,
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

  // Time left runs from the start of the next cell to the end of the grid, in real days.
  const daysLeft =
    i.current >= TOTAL - 1
      ? 0
      : daysBetween(cellDateAt(i.birthISO, i.current + 1), addYears(i.birthISO, ROWS))
  const on = markAt(i.marks, i.current)
  const next = nextMark(i.marks, i.current)
  const nextCopy = next
    ? `next 1,000-week mark: week ${fmtInt(next.week)}, ${formatDate(next.dateISO)}, in ${fmtInt(next.inWeeks)} wk`
    : null
  const last = i.marks[i.marks.length - 1]
  const detail = on
    ? [`you are on the ${fmtInt(on.week)}-week mark`, nextCopy].filter(Boolean).join(' · ')
    : (nextCopy ?? `past the ${fmtInt(last.week)}-week mark`)
  return {
    figure: formatPct(elapsedPct(i.current)),
    lead: 'of the grid is behind you. Every square is one week.',
    remaining: `${formatSpan(daysLeft, i.unit)} left`,
    detail,
  }
}
