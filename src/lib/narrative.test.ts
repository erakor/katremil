import { describe, expect, it } from 'vitest'
import { addDays, addYears } from './dates'
import { chapterShare } from './chapterShare'
import { COLS, TOTAL, currentCell, chapterIndexForCells, lastWeekCells } from './life'
import { marksFor } from './milestones'
import { readout, shareLine } from './narrative'
import type { ReadoutInput } from './narrative'
import { personaLife } from './personas'
import { stampMath } from './stamps'

const TODAY = '2026-11-21'
const life = personaLife('39', TODAY)
const current = currentCell(life.birthISO, TODAY)
const lastWeeks = lastWeekCells(life, TODAY)
const marks = marksFor(life.birthISO)

const base: ReadoutInput = {
  lens: 'chapters',
  birthISO: life.birthISO,
  current,
  chapters: life.chapters,
  chapterIdx: chapterIndexForCells(life, TODAY),
  lastWeeks,
  shares: life.chapters.map((c) => chapterShare(life.birthISO, c, TODAY)),
  xray: { forgotten: false, sleep: false, work: false },
  hoverCell: null,
  stamp: null,
  times: {
    label: 'Beach trips',
    takeaway: 'About 41 trips left, if the pace holds.',
    past: 39,
    future: 41,
  },
  unit: 'weeks',
  marks,
}
const lastCell = [...lastWeeks.keys()][0]
const stamp = { label: '10-wk Summer', weeks: 10, anchor: 520, math: stampMath(520, 10, current) }

describe('readout priority', () => {
  it('defaults to the lens', () => {
    expect(readout(base).lead).toMatch(/Every square/)
    expect(readout({ ...base, lens: 'times' }).lead).toMatch(/41 trips/)
  })

  it('x-ray beats the lens default', () => {
    const r = readout({ ...base, xray: { ...base.xray, sleep: true, work: true } })
    expect(r.lead).toMatch(/awake and unclaimed/)
  })

  it('a hovered cell beats x-ray', () => {
    const r = readout({
      ...base,
      xray: { forgotten: false, sleep: true, work: true },
      hoverCell: 100,
    })
    expect(r.detail).toMatch(/Age 1, week 49/)
  })

  it('a last-time cell beats an ordinary hovered cell', () => {
    expect(readout({ ...base, hoverCell: lastCell }).lead).toMatch(/last week of/)
  })

  it('a stamp beats everything', () => {
    const r = readout({ ...base, hoverCell: lastCell, stamp })
    expect(r.lead).toMatch(/10-wk Summer/)
    expect(r.lead).toMatch(/1\.9%/)
  })

  it('ignores a stamp that covers nothing', () => {
    const empty = { ...stamp, math: stampMath(4160, 10, current) }
    expect(readout({ ...base, stamp: empty }).lead).toMatch(/Every square/)
  })

  it('opens with the share of the grid behind you and the time left', () => {
    const r = readout(base)
    expect(r.figure).toBe('49.2%')
    expect(r.remaining).toBe('2,118 weeks left')
    expect(readout({ ...base, unit: 'years' }).remaining).toBe('40 years 31 weeks left')
    expect(readout({ ...base, unit: 'days' }).remaining).toMatch(/^14,8\d\d days left$/)
  })

  it('never shows 100% while a week is left', () => {
    const r = readout({ ...base, current: TOTAL - 1 })
    expect(r.figure).toBe('99.9%')
    expect(r.remaining).toBe('0 weeks left')
  })

  it('names the next 1,000-week mark', () => {
    expect(readout(base).detail).toMatch(/week 3,000.*in \d+ wk/)
    expect(readout({ ...base, current: marks[3].cell + 1 }).detail).toBe('past the 4,000-week mark')
  })

  it('says so when you are standing on a mark', () => {
    expect(readout({ ...base, current: marks[3].cell }).detail).toBe(
      'you are on the 4,000-week mark',
    )
    expect(readout({ ...base, current: marks[0].cell }).detail).toMatch(
      /^you are on the 1,000-week mark · next 1,000-week mark: week 2,000/,
    )
  })

  it('explains a hovered mark cell, past or future', () => {
    expect(readout({ ...base, hoverCell: marks[0].cell }).lead).toMatch(
      /passed the 1,000-week mark/,
    )
    expect(readout({ ...base, hoverCell: marks[2].cell }).lead).toMatch(/3,000-week mark arrives/)
  })

  it('keeps the chapter on a hovered past mark', () => {
    const cell = marks[0].cell
    const ci = base.chapterIdx[cell]
    expect(ci).toBeGreaterThanOrEqual(0)
    expect(readout({ ...base, hoverCell: cell }).detail).toContain(`“${life.chapters[ci].label}”`)
  })
})

describe('chapter share on hover', () => {
  it('shows how an ended chapter thins out (the hometown: 46%, 30%, 22%)', () => {
    const r = readout({ ...base, hoverCell: 5 * COLS + 3 })
    expect(r.lead).toMatch(/seaside hometown/)
    expect(r.share).toBe('46% of your life now · 30% at 60 · 22% at 80')
  })

  it('says an ongoing chapter only grows if it continues', () => {
    const r = readout({ ...base, hoverCell: current - 3 })
    expect(r.lead).toMatch(/Present chapter/)
    expect(r.share).toMatch(/^1\d% of your life now · if it continues, \d\d% at 60 · \d\d% at 80$/)
  })

  it('keeps the line on a past mark inside a chapter', () => {
    expect(readout({ ...base, hoverCell: marks[0].cell }).share).toMatch(/of your life now/)
  })

  it('stays off future weeks, the current week and the other readouts', () => {
    expect(readout({ ...base, hoverCell: current + 10 }).share).toBeUndefined()
    expect(readout({ ...base, hoverCell: current }).share).toBeUndefined()
    expect(readout({ ...base, hoverCell: lastCell }).share).toBeUndefined()
    expect(readout({ ...base, hoverCell: lastCell, stamp }).share).toBeUndefined()
    expect(readout(base).share).toBeUndefined()
  })

  it('stays off a past week that belongs to no chapter', () => {
    const gap = { ...life, chapters: [{ ...life.chapters[1] }] }
    const r = readout({
      ...base,
      chapters: gap.chapters,
      chapterIdx: chapterIndexForCells(gap, TODAY),
      lastWeeks: lastWeekCells(gap, TODAY),
      shares: gap.chapters.map((c) => chapterShare(gap.birthISO, c, TODAY)),
      hoverCell: 5 * COLS,
    })
    expect(r.lead).toMatch(/before you were keeping track/)
    expect(r.share).toBeUndefined()
  })

  it('drops ages already behind you', () => {
    const old = personaLife('65', TODAY)
    const s = chapterShare(old.birthISO, old.chapters[0], TODAY)
    expect(shareLine(s!)).toMatch(/^\d+% of your life now · \d+% at 80$/)
    const older = addYears(TODAY, -85)
    const gone = chapterShare(
      older,
      { ...old.chapters[0], startISO: older, endISO: addDays(addYears(older, 18), -1) },
      TODAY,
    )
    expect(shareLine(gone!)).toMatch(/^\d+% of your life now$/)
  })

  it('has a compact form for the chapter editor', () => {
    expect(shareLine(base.shares[0]!, true)).toBe('46% now · 30% at 60 · 22% at 80')
    expect(shareLine(base.shares[3]!, true)).toMatch(
      /^1\d% now · if it continues, \d\d% at 60 · \d\d% at 80$/,
    )
  })
})
