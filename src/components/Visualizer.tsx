'use client'

import { useCallback, useEffect, useMemo, useReducer, useSyncExternalStore } from 'react'
import { Header } from '@/components/Header'
import type { PersonaChoice } from '@/components/Header'
import { LifeCanvas } from '@/components/LifeCanvas'
import { NarrativeReadout } from '@/components/NarrativeReadout'
import { Sidebar } from '@/components/Sidebar'
import type { Lens } from '@/components/Sidebar'
import { todayISO } from '@/lib/dates'
import { TOTAL, chapterIndexForCells, chapterWeeks, currentCell, lastWeekCells } from '@/lib/life'
import type { Chapter, Life } from '@/lib/life'
import { readout } from '@/lib/narrative'
import { DEFAULT_PERSONA, getPersona, personaLife } from '@/lib/personas'
import { pigmentHex } from '@/lib/pigments'
import type { StampMark } from '@/lib/render'
import { loadCustom, saveCustom } from '@/lib/storage'
import { STAMPS, stampMath } from '@/lib/stamps'
import { makePresets, nearestCadence, occurrences, summary } from '@/lib/timesLeft'
import type { XrayFlags } from '@/lib/xray'

interface Pinned {
  id: string
  anchor: number
}

interface State {
  personaId: PersonaChoice
  custom: Life | null
  lens: Lens
  warp: number
  xray: XrayFlags
  peek: boolean
  stampId: string | null
  pinned: Pinned[]
  presetId: string
  cadence: number
  horizon: number
  hover: number | null
}

type Action =
  | { type: 'persona'; id: PersonaChoice; life?: Life }
  | { type: 'hydrate'; life: Life }
  | { type: 'life'; life: Life }
  | { type: 'lens'; lens: Lens }
  | { type: 'warp'; value: number }
  | { type: 'xray'; key: keyof XrayFlags; on: boolean }
  | { type: 'peek'; on: boolean }
  | { type: 'stamp'; id: string | null }
  | { type: 'cell'; cell: number }
  | { type: 'clear' }
  | { type: 'clearPins' }
  | { type: 'preset'; id: string; cadence: number; horizon: number }
  | { type: 'cadence'; value: number }
  | { type: 'horizon'; value: number }
  | { type: 'hover'; cell: number | null }

const MAX_PINS = 4

const initial: State = {
  personaId: DEFAULT_PERSONA,
  custom: null,
  lens: 'chapters',
  warp: 0,
  xray: { forgotten: false, sleep: false, work: false },
  peek: false,
  stampId: null,
  pinned: [],
  presetId: 'parents',
  cadence: 2,
  horizon: 60,
  hover: null,
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'persona':
      return { ...s, personaId: a.id, custom: a.life ?? s.custom, pinned: [], hover: null }
    case 'hydrate':
      return { ...s, personaId: 'custom', custom: a.life }
    case 'life':
      return { ...s, personaId: 'custom', custom: a.life }
    case 'lens':
      return { ...s, lens: a.lens, stampId: null, hover: null }
    case 'warp':
      return { ...s, warp: a.value }
    case 'xray':
      return { ...s, xray: { ...s.xray, [a.key]: a.on } }
    case 'peek':
      return s.peek === a.on ? s : { ...s, peek: a.on }
    case 'stamp':
      return { ...s, stampId: a.id }
    case 'cell': {
      if (!s.stampId) return { ...s, hover: a.cell }
      const dup = s.pinned.findIndex((p) => p.id === s.stampId && p.anchor === a.cell)
      const pinned =
        dup >= 0
          ? s.pinned.filter((_, i) => i !== dup)
          : [...s.pinned, { id: s.stampId, anchor: a.cell }].slice(-MAX_PINS)
      return { ...s, pinned, hover: a.cell }
    }
    case 'clear':
      return { ...s, stampId: null, pinned: [], hover: null }
    case 'clearPins':
      return { ...s, pinned: [] }
    case 'preset':
      return { ...s, presetId: a.id, cadence: a.cadence, horizon: a.horizon }
    case 'cadence':
      return { ...s, cadence: a.value }
    case 'horizon':
      return { ...s, horizon: a.value }
    case 'hover':
      return s.hover === a.cell ? s : { ...s, hover: a.cell }
  }
}

// Server render and hydration both see this fixed date; the real day replaces it right after.
const SERVER_TODAY = '2026-01-01'
// Re-read the date when the tab comes back (e.g. left open overnight).
const subscribeToday = (onChange: () => void) => {
  window.addEventListener('focus', onChange)
  document.addEventListener('visibilitychange', onChange)
  return () => {
    window.removeEventListener('focus', onChange)
    document.removeEventListener('visibilitychange', onChange)
  }
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  return (
    ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY'].includes(t.tagName) || t.isContentEditable
  )
}

export function Visualizer() {
  const today = useSyncExternalStore(subscribeToday, todayISO, () => SERVER_TODAY)
  const [s, dispatch] = useReducer(reducer, initial)

  // A saved custom life takes over once the browser can be asked for it.
  useEffect(() => {
    const saved = loadCustom()
    if (saved) dispatch({ type: 'hydrate', life: saved })
  }, [])

  const isCustom = s.personaId === 'custom'
  const life = useMemo<Life>(
    () =>
      isCustom && s.custom
        ? s.custom
        : personaLife(s.personaId === 'custom' ? DEFAULT_PERSONA : s.personaId, today),
    [isCustom, s.custom, s.personaId, today],
  )

  // Only a custom life is ever written. Sample personas are derived and never saved.
  useEffect(() => {
    if (isCustom && s.custom) saveCustom(s.custom)
  }, [isCustom, s.custom])

  // Space held = peek at every x-ray layer.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isTypingTarget(e.target)) return
      e.preventDefault()
      dispatch({ type: 'peek', on: true })
    }
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      dispatch({ type: 'peek', on: false })
    }
    const blur = () => dispatch({ type: 'peek', on: false })
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  const current = useMemo(() => currentCell(life.birthISO, today), [life.birthISO, today])
  const chapterIdx = useMemo(() => chapterIndexForCells(life, today), [life, today])
  const lastWeeks = useMemo(() => lastWeekCells(life, today), [life, today])
  const chapterHex = useMemo(() => life.chapters.map((c) => pigmentHex(c.pigment)), [life.chapters])
  const lengths = useMemo(() => chapterWeeks(life, today), [life, today])

  const kidBornAge = s.personaId === 'custom' ? 33 : getPersona(s.personaId).kidBornAge
  const presets = useMemo(() => makePresets(kidBornAge), [kidBornAge])
  const preset = presets.find((p) => p.id === s.presetId) ?? presets[0]
  // One clamped horizon feeds both the slider and the count, so they always agree.
  const horizon = Math.min(80, Math.max(s.horizon, Math.round(preset.startAge) + 1))
  const timesCells = useMemo(
    () => occurrences(preset, s.cadence, horizon),
    [preset, s.cadence, horizon],
  )
  const timesMask = useMemo(() => {
    const m = new Uint8Array(TOTAL)
    for (const c of timesCells) m[c] = 1
    return m
  }, [timesCells])
  const times = useMemo(
    () => summary(timesCells, current, preset.noun),
    [timesCells, current, preset.noun],
  )

  const xray: XrayFlags = s.peek ? { forgotten: true, sleep: true, work: true } : s.xray

  // Stamps: pinned ones stay; the selected one follows the pointer.
  const stamps = useMemo<StampMark[]>(() => {
    const out: StampMark[] = s.pinned.flatMap((p) => {
      const def = STAMPS.find((d) => d.id === p.id)
      return def ? [{ anchor: p.anchor, n: def.weeks, kind: 'pinned' as const }] : []
    })
    const sel = STAMPS.find((d) => d.id === s.stampId)
    if (sel && s.hover !== null && s.lens === 'chapters') {
      out.push({ anchor: s.hover, n: sel.weeks, kind: 'hover' })
    }
    return out
  }, [s.pinned, s.stampId, s.hover, s.lens])

  const activeStamp = useMemo(() => {
    const sel = STAMPS.find((d) => d.id === s.stampId)
    let pick: { id: string; anchor: number } | null = null
    if (sel && s.hover !== null) pick = { id: sel.id, anchor: s.hover }
    else if (s.pinned.length > 0) pick = s.pinned[s.pinned.length - 1]
    const def = pick && STAMPS.find((d) => d.id === pick.id)
    if (!pick || !def || s.lens !== 'chapters') return null
    return {
      label: def.label,
      weeks: def.weeks,
      anchor: pick.anchor,
      math: stampMath(pick.anchor, def.weeks, current, lengths),
    }
  }, [s.stampId, s.hover, s.pinned, s.lens, current, lengths])

  const text = useMemo(
    () =>
      readout({
        lens: s.lens,
        birthISO: life.birthISO,
        current,
        chapters: life.chapters,
        chapterIdx,
        lastWeeks,
        xray,
        hoverCell: s.hover,
        stamp: activeStamp,
        times: {
          label: preset.label,
          takeaway: times.takeaway,
          past: times.past,
          future: times.future,
        },
      }),
    // `xray` is derived from two state fields, so list those instead of the fresh object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      s.lens,
      life,
      current,
      chapterIdx,
      lastWeeks,
      s.peek,
      s.xray,
      s.hover,
      activeStamp,
      preset.label,
      times,
    ],
  )

  const onPersona = useCallback(
    (id: PersonaChoice) => {
      if (id === 'custom') {
        // Reuse the saved life, or start from whatever is on screen.
        dispatch({ type: 'persona', id, life: s.custom ?? life })
      } else dispatch({ type: 'persona', id })
    },
    [s.custom, life],
  )

  const onChapters = useCallback(
    (chapters: Chapter[]) =>
      dispatch({ type: 'life', life: { birthISO: life.birthISO, chapters } }),
    [life.birthISO],
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        personaId={s.personaId}
        onPersona={onPersona}
        birthISO={life.birthISO}
        maxBirthISO={today}
        onBirth={(iso) => dispatch({ type: 'life', life: { ...life, birthISO: iso } })}
      />
      <div className="grid flex-1 lg:grid-cols-[7fr_3fr]">
        <main className="flex min-w-0 flex-col pb-5">
          <NarrativeReadout readout={text} />
          <div className="h-[max(480px,calc(100dvh-14rem))] px-3 pt-2">
            <LifeCanvas
              current={current}
              chapterIdx={chapterIdx}
              chapterHex={chapterHex}
              lastWeeks={lastWeeks}
              times={s.lens === 'times' ? timesMask : null}
              lens={s.lens}
              warp={s.warp}
              xray={xray}
              stamps={stamps}
              hover={s.hover}
              onHover={(cell) => dispatch({ type: 'hover', cell })}
              onCell={(cell) => dispatch({ type: 'cell', cell })}
              onClear={() => dispatch({ type: 'clear' })}
            />
          </div>
        </main>
        <Sidebar
          lens={s.lens}
          onLens={(lens) => dispatch({ type: 'lens', lens })}
          warp={s.warp}
          onWarp={(value) => dispatch({ type: 'warp', value })}
          xray={s.xray}
          onXray={(key, on) => dispatch({ type: 'xray', key, on })}
          stampId={s.stampId}
          onStamp={(id) => dispatch({ type: 'stamp', id })}
          pinnedCount={s.pinned.length}
          onClearStamps={() => dispatch({ type: 'clearPins' })}
          chapters={life.chapters}
          birthISO={life.birthISO}
          isSample={!isCustom}
          onChapters={onChapters}
          presets={presets}
          presetId={preset.id}
          onPreset={(id) => {
            const p = presets.find((x) => x.id === id) ?? presets[0]
            dispatch({
              type: 'preset',
              id,
              cadence: nearestCadence(p.perYear),
              horizon: p.horizonAge,
            })
          }}
          cadence={s.cadence}
          onCadence={(value) => dispatch({ type: 'cadence', value })}
          horizon={horizon}
          onHorizon={(value) => dispatch({ type: 'horizon', value })}
          summary={times}
          preset={preset}
        />
      </div>
    </div>
  )
}
