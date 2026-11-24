import { describe, expect, it } from 'vitest'
import { addDays, addYears } from './dates'
import { chapterShare } from './chapterShare'
import type { Chapter, Life } from './life'
import { personaLife } from './personas'

const TODAY = '2026-11-21'

const chapter = (startISO: string, endISO?: string): Chapter => ({
  id: 'c',
  label: 'Chapter',
  startISO,
  endISO,
  pigment: 'ochre',
})
const ages = (s: ReturnType<typeof chapterShare>) => s?.projections.map((p) => p.age)

describe('chapterShare', () => {
  it('dilutes an ended chapter (the 39-year-old hometown: about 46%, 30%, 22%)', () => {
    const life = personaLife('39', TODAY)
    const s = chapterShare(life.birthISO, life.chapters[0], TODAY)!
    expect(s.weeks).toBe(939)
    expect(s.now).toBeCloseTo(45.7, 1)
    expect(s.projections).toHaveLength(2)
    expect(s.projections[0].age).toBe(60)
    expect(s.projections[0].pct).toBeCloseTo(30.0, 1)
    expect(s.projections[1].age).toBe(80)
    expect(s.projections[1].pct).toBeCloseTo(22.5, 1)
    expect(s.grows).toBe(false)
  })

  it('grows an ongoing chapter, assuming it continues to each age', () => {
    const life = personaLife('39', TODAY)
    const present = life.chapters[3]
    expect(present.endISO).toBeUndefined()
    const s = chapterShare(life.birthISO, present, TODAY)!
    expect(s.grows).toBe(true)
    // From 33 onward: 6.4 of 39.4 years now, 27 of 60, 47 of 80.
    expect(s.now).toBeCloseTo(16.4, 0)
    expect(s.projections[0].pct).toBeCloseTo((27 / 60) * 100, 0)
    expect(s.projections[1].pct).toBeCloseTo((47 / 80) * 100, 0)
    expect(s.now).toBeLessThan(s.projections[0].pct)
    expect(s.projections[0].pct).toBeLessThan(s.projections[1].pct)
  })

  it('never passes 100%, even for an ongoing chapter that started at birth', () => {
    const birth = '1990-06-15'
    const s = chapterShare(birth, chapter(birth), TODAY)!
    expect(s.now).toBeLessThanOrEqual(100)
    expect(s.now).toBeGreaterThan(99)
    for (const p of s.projections) {
      expect(p.pct).toBeLessThanOrEqual(100)
      expect(p.pct).toBeGreaterThan(99)
    }
  })

  it('drops age 60 for someone already past it', () => {
    const life = personaLife('65', TODAY)
    expect(ages(chapterShare(life.birthISO, life.chapters[0], TODAY))).toEqual([80])
  })

  it('drops both projections for someone past 80', () => {
    const birth = addYears(TODAY, -85)
    const s = chapterShare(birth, chapter(birth, addYears(birth, 18)), TODAY)!
    expect(s.projections).toEqual([])
    expect(s.now).toBeCloseTo((18 / 85) * 100, 0)
  })

  it('treats a birthday that is today as already reached', () => {
    const birth = addYears(TODAY, -60)
    expect(ages(chapterShare(birth, chapter(birth, addYears(birth, 18)), TODAY))).toEqual([80])
  })

  it('counts only the chapter itself when a gap comes before it', () => {
    const birth = '1990-06-15'
    // Nothing from 18 to 25, then a five-year chapter.
    const ended = chapter(addYears(birth, 25), addDays(addYears(birth, 30), -1))
    const s = chapterShare(birth, ended, TODAY)!
    expect(s.projections[0].pct).toBeCloseTo((5 / 60) * 100, 0)
    expect(s.projections[1].pct).toBeCloseTo((5 / 80) * 100, 0)
    // An ongoing chapter after a gap grows from its own start, not from the gap.
    const open = chapterShare(birth, chapter(addYears(birth, 30)), TODAY)!
    expect(open.projections[0].pct).toBeCloseTo((30 / 60) * 100, 0)
    expect(open.projections[1].pct).toBeCloseTo((50 / 80) * 100, 0)
  })

  it('follows a sample persona once it is edited into a custom life', () => {
    const sample = personaLife('39', TODAY)
    // What the editor does: same birth date, chapters patched in place.
    const custom: Life = {
      birthISO: sample.birthISO,
      chapters: sample.chapters.map((c, i) =>
        i === 0
          ? { ...c, endISO: addDays(addYears(sample.birthISO, 16), -1) }
          : i === 3
            ? { ...c, endISO: addYears(sample.birthISO, 38) }
            : c,
      ),
    }
    const home = chapterShare(custom.birthISO, custom.chapters[0], TODAY)!
    expect(home.projections[0].pct).toBeCloseTo((16 / 60) * 100, 0)
    expect(home.projections[1].pct).toBeCloseTo((16 / 80) * 100, 0)
    // The present chapter is now closed, so it only gets diluted.
    const closed = chapterShare(custom.birthISO, custom.chapters[3], TODAY)!
    expect(closed.grows).toBe(false)
    expect(closed.projections[0].pct).toBeCloseTo((5 / 60) * 100, 0)
  })

  it('lets a chapter with a future end date grow until that date only', () => {
    const birth = '1990-06-15'
    const s = chapterShare(birth, chapter(addYears(birth, 30), addYears(birth, 70)), TODAY)!
    expect(s.grows).toBe(true)
    expect(s.projections[0].pct).toBeCloseTo((30 / 60) * 100, 0)
    expect(s.projections[1].pct).toBeCloseTo((40 / 80) * 100, 0)
  })

  it('has nothing to say about a chapter that has not started', () => {
    expect(chapterShare('1990-06-15', chapter(addDays(TODAY, 1)), TODAY)).toBeNull()
  })
})
