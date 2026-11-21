'use client'

import type { ReactNode } from 'react'
import { ChapterEditor } from '@/components/ChapterEditor'
import { Segmented } from '@/components/ui/Segmented'
import { Slider } from '@/components/ui/Slider'
import { fmtInt } from '@/lib/dates'
import type { Chapter } from '@/lib/life'
import { STAMPS } from '@/lib/stamps'
import { CADENCES } from '@/lib/timesLeft'
import type { Preset, TimesSummary } from '@/lib/timesLeft'
import type { XrayFlags } from '@/lib/xray'

export type Lens = 'chapters' | 'times'

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-hairline px-5 py-4 first:border-t-0">
      <h2 className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{title}</h2>
      {children}
    </section>
  )
}

export interface SidebarProps {
  lens: Lens
  onLens: (l: Lens) => void
  warp: number
  onWarp: (v: number) => void
  xray: XrayFlags
  onXray: (key: keyof XrayFlags, on: boolean) => void
  stampId: string | null
  onStamp: (id: string | null) => void
  pinnedCount: number
  onClearStamps: () => void
  chapters: Chapter[]
  birthISO: string
  isSample: boolean
  onChapters: (c: Chapter[]) => void
  presets: Preset[]
  presetId: string
  onPreset: (id: string) => void
  cadence: number
  onCadence: (n: number) => void
  horizon: number
  onHorizon: (n: number) => void
  summary: TimesSummary
  preset: Preset
}

export function Sidebar(p: SidebarProps) {
  return (
    <aside className="border-t border-hairline lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto lg:border-t-0 lg:border-l">
      <Group title="Lens">
        <Segmented<Lens>
          full
          ariaLabel="Lens"
          value={p.lens}
          onChange={p.onLens}
          options={[
            { value: 'chapters', label: 'Chapters' },
            { value: 'times', label: 'Times Left' },
          ]}
        />
      </Group>

      {p.lens === 'chapters' ? (
        <>
          <Group title="Time">
            <Slider
              label="How it feels"
              value={p.warp}
              min={0}
              max={1}
              step={0.01}
              onChange={p.onWarp}
              format={(v) => `${Math.round(v * 100)}%`}
              ends={['Clock', 'Felt']}
            />
          </Group>

          <Group title="X-ray">
            <div className="space-y-2">
              {(
                [
                  ['forgotten', 'Forgotten years'],
                  ['sleep', 'Sleep'],
                  ['work', 'Work'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.xray[key]}
                    onChange={(e) => p.onXray(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted">
              Or hold <kbd className="num rounded border border-hairline px-1">Space</kbd> to peek.
            </p>
          </Group>

          <Group title="Stamps">
            <div className="flex flex-wrap gap-1.5">
              {STAMPS.map((s) => {
                const on = p.stampId === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => p.onStamp(on ? null : s.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      on
                        ? 'border-amber bg-amber/15 text-amber'
                        : 'border-hairline text-ink hover:bg-white/5'
                    }`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted">
              Pick one, then move over the grid. Click to leave it in place.
              {p.pinnedCount > 0 && (
                <>
                  {' '}
                  <button type="button" onClick={p.onClearStamps} className="underline">
                    Clear {p.pinnedCount}
                  </button>
                </>
              )}
            </p>
          </Group>

          <Group title="Chapters">
            <ChapterEditor
              chapters={p.chapters}
              birthISO={p.birthISO}
              isSample={p.isSample}
              onChange={p.onChapters}
            />
          </Group>
        </>
      ) : (
        <>
          <Group title="What to count">
            <ul className="space-y-1">
              {p.presets.map((pr) => (
                <li key={pr.id}>
                  <button
                    type="button"
                    aria-pressed={pr.id === p.presetId}
                    onClick={() => p.onPreset(pr.id)}
                    className={`w-full rounded px-2.5 py-1.5 text-left text-sm transition-colors ${
                      pr.id === p.presetId ? 'bg-white/10 text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {pr.label}
                  </button>
                </li>
              ))}
            </ul>
          </Group>
          <Group title="Pace">
            <Slider
              label="Per year"
              value={CADENCES.indexOf(p.cadence)}
              min={0}
              max={CADENCES.length - 1}
              onChange={(i) => p.onCadence(CADENCES[i])}
              format={(i) => `${CADENCES[i]} / yr`}
            />
            <Slider
              label="Until age"
              value={p.horizon}
              min={Math.min(79, Math.round(p.preset.startAge) + 1)}
              max={80}
              onChange={p.onHorizon}
            />
          </Group>
          <Group title="At this pace">
            <p className="num text-5xl leading-none text-amber">{fmtInt(p.summary.future)}</p>
            <p className="text-sm text-muted">
              {p.preset.noun} left of {fmtInt(p.summary.total)}.{' '}
              <span className="num">{Math.round(p.summary.pctBehind)}%</span> already behind you.
            </p>
          </Group>
        </>
      )}
    </aside>
  )
}
