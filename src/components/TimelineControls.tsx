'use client'

import { useRef, useState } from 'react'
import { Download, RefreshCw, Trash2, Upload } from 'lucide-react'
import { mondayOf, weekId } from '@/lib/dates'
import { exportState, readImportFile } from '@/lib/storage'
import type { Timeline } from '@/lib/timeline'
import type { Config, Persisted, TimelineMode } from '@/lib/types'
import { Panel, btn, input, labelCls } from './ui/Panel'
import { Segmented } from './ui/Segmented'

export function TimelineControls({
  config,
  tl,
  getPersisted,
  onMode,
  onAnchor,
  onSync,
  onClear,
  onImport,
}: {
  config: Config
  tl: Timeline
  getPersisted: () => Persisted
  onMode: (m: TimelineMode) => void
  onAnchor: (d: string) => void
  onSync: (fromId: number, toId: number) => void
  onClear: () => void
  onImport: (p: Persisted) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const birth = config.mode !== 'horizon'

  const sync = () => {
    const from = birth ? weekId(mondayOf(tl.anchor)) : tl.startWeekId
    onSync(from, weekId(tl.today))
    setMsg({ kind: 'ok', text: 'Marked every week before this one as passed.' })
  }

  return (
    <Panel className="p-4">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <div>
          <span className={labelCls}>Timeline mode</span>
          <Segmented<TimelineMode>
            ariaLabel="Timeline mode"
            value={config.mode}
            onChange={onMode}
            options={[
              { value: 'horizon', label: 'Horizon', title: '4,000 weeks starting from a date' },
              { value: 'birthFull', label: 'Birth · Full', title: '4,000 weeks from your birth' },
              {
                value: 'birthRemaining',
                label: 'Birth · Remaining',
                title: 'Only the weeks you have left',
              },
            ]}
          />
        </div>
        <div>
          <label htmlFor="anchor-date" className={labelCls}>
            {birth ? 'Birth date' : 'Start date'}
          </label>
          <input
            id="anchor-date"
            type="date"
            className={`${input} num w-44`}
            value={config.anchorDate}
            max="9999-12-31"
            min="1000-01-01"
            onChange={(e) => e.target.value && onAnchor(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btn} onClick={sync}>
            <RefreshCw size={14} aria-hidden /> Sync Elapsed to Today
          </button>
          {confirming ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-sm text-rose-900">
              Clear all passed weeks?
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => {
                  onClear()
                  setConfirming(false)
                  setMsg({ kind: 'ok', text: 'Passed weeks cleared.' })
                }}
              >
                Confirm
              </button>
              <button type="button" className="underline" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button type="button" className={btn} onClick={() => setConfirming(true)}>
              <Trash2 size={14} aria-hidden /> Clear Passed
            </button>
          )}
          <button
            type="button"
            className={btn}
            onClick={() => exportState(getPersisted(), tl.today)}
          >
            <Download size={14} aria-hidden /> Export
          </button>
          <button type="button" className={btn} onClick={() => fileRef.current?.click()}>
            <Upload size={14} aria-hidden /> Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import ledger JSON file"
            data-testid="import-input"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              const res = await readImportFile(file)
              if (res.ok) {
                onImport(res.data)
                setMsg({
                  kind: 'ok',
                  text: `Imported ${res.data.events.length} events and ${res.data.milestones.length} milestones.`,
                })
              } else setMsg({ kind: 'err', text: `Import failed: ${res.error}` })
            }}
          />
        </div>
      </div>
      {birth && (
        <p className="mt-2 text-xs text-slate-500">
          Birth modes count weeks from the Monday of your birth week.
        </p>
      )}
      <p
        role={msg?.kind === 'err' ? 'alert' : 'status'}
        className={`mt-2 min-h-4 text-xs ${msg?.kind === 'err' ? 'text-rose-700' : 'text-slate-600'}`}
      >
        {msg?.text}
      </p>
    </Panel>
  )
}
