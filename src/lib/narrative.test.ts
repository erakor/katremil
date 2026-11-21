import { describe, expect, it } from 'vitest'
import { currentCell, chapterIndexForCells, lastWeekCells } from './life'
import { readout } from './narrative'
import type { ReadoutInput } from './narrative'
import { personaLife } from './personas'
import { stampMath } from './stamps'

const TODAY = '2026-11-21'
const life = personaLife('39', TODAY)
const current = currentCell(life.birthISO, TODAY)
const lastWeeks = lastWeekCells(life, TODAY)

const base: ReadoutInput = {
  lens: 'chapters',
  birthISO: life.birthISO,
  current,
  chapters: life.chapters,
  chapterIdx: chapterIndexForCells(life, TODAY),
  lastWeeks,
  xray: { forgotten: false, sleep: false, work: false },
  hoverCell: null,
  stamp: null,
  times: {
    label: 'Beach trips',
    takeaway: 'About 41 trips left, if the pace holds.',
    past: 39,
    future: 41,
  },
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
})
