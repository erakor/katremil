'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Plus } from 'lucide-react'
import { fmtInt } from '@/lib/dates'
import { aggregate, weekIndexForDate, inGrid } from '@/lib/timeline'
import type { EventIndex, Group, Timeline } from '@/lib/timeline'
import type { Milestone } from '@/lib/types'
import { Panel, btnPrimary } from './ui/Panel'
import { Segmented } from './ui/Segmented'

type Metric = 'active' | 'peak'
type By = 'year' | 'decade'

function ChartTip({
  active,
  payload,
  metric,
}: {
  active?: boolean
  payload?: { payload: Group }[]
  metric: Metric
}) {
  if (!active || !payload?.length) return null
  const g = payload[0].payload
  return (
    <div className="num rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold">{g.label}</p>
      <p>Active weeks: {fmtInt(g.active)}</p>
      <p>Peak concurrency: {g.peak}</p>
      <p className="text-slate-500">
        {metric === 'active' ? 'Showing active weeks' : 'Showing peak concurrency'}
      </p>
    </div>
  )
}

export default function LedgerAnalytics({
  tl,
  evIdx,
  milestones,
  hasEvents,
  onAddEvent,
}: {
  tl: Timeline
  evIdx: EventIndex
  milestones: Milestone[]
  hasEvents: boolean
  onAddEvent: () => void
}) {
  const [metric, setMetric] = useState<Metric>('active')
  const [by, setBy] = useState<By>('year')
  const groups = useMemo(() => aggregate(tl, evIdx, by), [tl, evIdx, by])
  const size = by === 'year' ? 52 : 520

  const groupAt = (idx: number) => groups[Math.min(groups.length - 1, Math.floor(idx / size))]
  const nowGroup = inGrid(tl, tl.todayIdx) ? groupAt(tl.todayIdx) : null
  const msLines = milestones
    .filter((m) => m.visible)
    .map((m) => ({ m, idx: weekIndexForDate(tl, m.date) }))
    .filter((x) => inGrid(tl, x.idx))
    .map((x) => ({ id: x.m.id, title: x.m.title, label: groupAt(x.idx).label }))

  const totalActive = evIdx.mapped
  const best = groups.reduce((a, g) => (g.active > a.active ? g : a), groups[0])
  const peak = groups.reduce((a, g) => Math.max(a, g.peak), 0)

  return (
    <Panel
      id="analytics"
      title="Analytics"
      eyebrow="Where your weeks go"
      actions={
        <div className="flex flex-wrap gap-2">
          <Segmented<Metric>
            ariaLabel="Metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'active', label: 'Active weeks' },
              { value: 'peak', label: 'Peak concurrency' },
            ]}
          />
          <Segmented<By>
            ariaLabel="Grouping"
            value={by}
            onChange={setBy}
            options={[
              { value: 'year', label: 'Year' },
              { value: 'decade', label: 'Decade' },
            ]}
          />
        </div>
      }
    >
      {!hasEvents ? (
        <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
          <p className="font-display text-lg">Nothing to chart yet</p>
          <p className="max-w-md text-sm text-slate-600">
            Add a life event and this panel shows how many weeks each year or decade carries, and
            when your commitments overlap.
          </p>
          <button type="button" className={btnPrimary} onClick={onAddEvent}>
            <Plus size={16} aria-hidden /> Add Life Event
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200 lg:grid-cols-3">
            <div className="px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Active weeks
              </p>
              <p className="num text-lg font-medium">{fmtInt(totalActive)}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Busiest {by}
              </p>
              <p className="num text-lg font-medium">
                {best.label}{' '}
                <span className="text-sm text-slate-500">· {fmtInt(best.active)} wks</span>
              </p>
            </div>
            <div className="hidden px-4 py-3 lg:block">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Peak concurrency
              </p>
              <p className="num text-lg font-medium">{peak}</p>
            </div>
          </div>
          <div
            className="h-72 w-full px-2 py-4"
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- wraps a Recharts SVG, not a raster image
            role="img"
            aria-label={`Area chart of ${metric === 'active' ? 'active weeks' : 'peak concurrency'} per ${by}`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={groups} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fontFamily: 'var(--font-plex-mono)', fill: '#64748B' }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fontFamily: 'var(--font-plex-mono)', fill: '#64748B' }}
                  width={36}
                />
                <Tooltip content={<ChartTip metric={metric} />} />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="#1D4ED8"
                  strokeWidth={2}
                  fill="#1D4ED8"
                  fillOpacity={0.15}
                  isAnimationActive={false}
                />
                {nowGroup && (
                  <ReferenceLine
                    x={nowGroup.label}
                    stroke="#0F172A"
                    strokeDasharray="4 3"
                    label={{
                      value: 'Now',
                      position: 'insideTopRight',
                      fontSize: 11,
                      fill: '#0F172A',
                    }}
                  />
                )}
                {msLines.map((l) => (
                  <ReferenceLine
                    key={l.id}
                    x={l.label}
                    stroke="#64748B"
                    strokeDasharray="2 3"
                    label={{
                      value: l.title,
                      position: 'insideTopLeft',
                      fontSize: 10,
                      fill: '#475569',
                    }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Panel>
  )
}
