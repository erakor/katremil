'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { todayISO, weekId, mondayOf } from '@/lib/dates'
import { loadState, saveState } from '@/lib/storage'
import type { Config, LifeEvent, Milestone, Persisted, TimelineMode } from '@/lib/types'

export interface LedgerState {
  hydrated: boolean
  today: string
  config: Config
  passedWeeks: Set<number>
  events: LifeEvent[]
  milestones: Milestone[]
}

type Action =
  | { type: 'HYDRATE'; today: string; data: Persisted | null }
  | { type: 'TODAY'; today: string }
  | { type: 'SET_MODE'; mode: TimelineMode }
  | { type: 'SET_ANCHOR'; date: string }
  | { type: 'SET_CONFIG'; patch: Partial<Pick<Config, 'showLabels' | 'density' | 'highlight'>> }
  | { type: 'SET_WEEKS'; ids: number[]; value: boolean }
  | { type: 'SYNC_ELAPSED'; fromId: number; toId: number }
  | { type: 'CLEAR_PASSED' }
  | { type: 'ADD_EVENT'; event: LifeEvent }
  | { type: 'UPDATE_EVENT'; id: string; patch: Partial<LifeEvent> }
  | { type: 'DELETE_EVENT'; id: string }
  | { type: 'ADD_MILESTONE'; milestone: Milestone }
  | { type: 'UPDATE_MILESTONE'; id: string; patch: Partial<Milestone> }
  | { type: 'DELETE_MILESTONE'; id: string }
  | { type: 'IMPORT'; data: Persisted }

const initial: LedgerState = {
  hydrated: false,
  today: '',
  config: {
    mode: 'horizon',
    anchorDate: '2000-01-03',
    showLabels: true,
    density: 'standard',
    highlight: 'all',
  },
  passedWeeks: new Set(),
  events: [],
  milestones: [],
}

export const newId = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

/** Weeks from the birth week up to (not including) the current week, as absolute ids. */
function elapsedIds(birth: string, today: string): number[] {
  const from = weekId(mondayOf(birth))
  const to = weekId(today)
  const ids: number[] = []
  for (let id = Math.max(from, to - 4000); id < to; id++) ids.push(id)
  return ids
}

function reducer(s: LedgerState, a: Action): LedgerState {
  switch (a.type) {
    case 'HYDRATE': {
      const d = a.data
      if (!d)
        return {
          ...s,
          hydrated: true,
          today: a.today,
          config: { ...s.config, anchorDate: a.today },
        }
      return {
        hydrated: true,
        today: a.today,
        config: d.config,
        passedWeeks: new Set(d.passedWeeks),
        events: d.events,
        milestones: d.milestones,
      }
    }
    case 'TODAY':
      return a.today === s.today ? s : { ...s, today: a.today }
    case 'SET_MODE': {
      const config = { ...s.config, mode: a.mode }
      let passedWeeks = s.passedWeeks
      if (a.mode === 'birthFull' && passedWeeks.size === 0)
        passedWeeks = new Set(elapsedIds(config.anchorDate, s.today))
      return { ...s, config, passedWeeks }
    }
    case 'SET_ANCHOR': {
      const config = { ...s.config, anchorDate: a.date }
      let passedWeeks = s.passedWeeks
      if (config.mode === 'birthFull' && passedWeeks.size === 0)
        passedWeeks = new Set(elapsedIds(a.date, s.today))
      return { ...s, config, passedWeeks }
    }
    case 'SET_CONFIG':
      return { ...s, config: { ...s.config, ...a.patch } }
    case 'SET_WEEKS': {
      const next = new Set(s.passedWeeks)
      let changed = false
      for (const id of a.ids) {
        if (a.value) {
          if (!next.has(id)) {
            next.add(id)
            changed = true
          }
        } else if (next.delete(id)) changed = true
      }
      return changed ? { ...s, passedWeeks: next } : s
    }
    case 'SYNC_ELAPSED': {
      const next = new Set(s.passedWeeks)
      for (let id = a.fromId; id < a.toId; id++) next.add(id)
      return { ...s, passedWeeks: next }
    }
    case 'CLEAR_PASSED':
      return { ...s, passedWeeks: new Set() }
    case 'ADD_EVENT':
      return { ...s, events: [...s.events, a.event] }
    case 'UPDATE_EVENT':
      return { ...s, events: s.events.map((e) => (e.id === a.id ? { ...e, ...a.patch } : e)) }
    case 'DELETE_EVENT':
      return { ...s, events: s.events.filter((e) => e.id !== a.id) }
    case 'ADD_MILESTONE':
      return { ...s, milestones: [...s.milestones, a.milestone] }
    case 'UPDATE_MILESTONE':
      return {
        ...s,
        milestones: s.milestones.map((m) => (m.id === a.id ? { ...m, ...a.patch } : m)),
      }
    case 'DELETE_MILESTONE':
      return { ...s, milestones: s.milestones.filter((m) => m.id !== a.id) }
    case 'IMPORT':
      return {
        ...s,
        config: a.data.config,
        passedWeeks: new Set(a.data.passedWeeks),
        events: a.data.events,
        milestones: a.data.milestones,
      }
  }
}

export function toPersisted(s: LedgerState): Persisted {
  return {
    version: 1,
    config: s.config,
    passedWeeks: [...s.passedWeeks].sort((x, y) => x - y),
    events: s.events,
    milestones: s.milestones,
  }
}

export function useLedgerState() {
  const [state, dispatch] = useReducer(reducer, initial)
  const latest = useRef(state)

  // Hydrate from localStorage after mount so server and client markup agree.
  useEffect(() => {
    dispatch({ type: 'HYDRATE', today: todayISO(), data: loadState() })
  }, [])

  // Keep "today" fresh when the tab regains focus (e.g. left open overnight).
  useEffect(() => {
    const refresh = () => dispatch({ type: 'TODAY', today: todayISO() })
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  // Debounced persistence, flushed when the page is hidden or closed.
  useEffect(() => {
    latest.current = state
    if (!state.hydrated) return
    const t = setTimeout(() => saveState(toPersisted(state)), 250)
    return () => clearTimeout(t)
  }, [state])

  useEffect(() => {
    const flush = () => {
      if (latest.current.hydrated) saveState(toPersisted(latest.current))
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [])

  const setMode = useCallback((mode: TimelineMode) => dispatch({ type: 'SET_MODE', mode }), [])
  const setAnchor = useCallback((date: string) => dispatch({ type: 'SET_ANCHOR', date }), [])
  const setConfig = useCallback(
    (patch: Partial<Pick<Config, 'showLabels' | 'density' | 'highlight'>>) =>
      dispatch({ type: 'SET_CONFIG', patch }),
    [],
  )
  const setWeeks = useCallback(
    (ids: number[], value: boolean) => dispatch({ type: 'SET_WEEKS', ids, value }),
    [],
  )
  const actions = useMemo(
    () => ({
      setMode,
      setAnchor,
      setConfig,
      setWeeks,
      syncElapsed: (fromId: number, toId: number) =>
        dispatch({ type: 'SYNC_ELAPSED', fromId, toId }),
      clearPassed: () => dispatch({ type: 'CLEAR_PASSED' }),
      addEvent: (event: LifeEvent) => dispatch({ type: 'ADD_EVENT', event }),
      updateEvent: (id: string, patch: Partial<LifeEvent>) =>
        dispatch({ type: 'UPDATE_EVENT', id, patch }),
      deleteEvent: (id: string) => dispatch({ type: 'DELETE_EVENT', id }),
      addMilestone: (milestone: Milestone) => dispatch({ type: 'ADD_MILESTONE', milestone }),
      updateMilestone: (id: string, patch: Partial<Milestone>) =>
        dispatch({ type: 'UPDATE_MILESTONE', id, patch }),
      deleteMilestone: (id: string) => dispatch({ type: 'DELETE_MILESTONE', id }),
      importData: (data: Persisted) => dispatch({ type: 'IMPORT', data }),
    }),
    [setMode, setAnchor, setConfig, setWeeks],
  )

  return { state, actions }
}
