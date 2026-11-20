'use client'

import { useEffect, useRef, useState } from 'react'
import { Crosshair, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import {
  TOTAL_WEEKS,
  addDays,
  addYears,
  daysBetween,
  fmtInt,
  formatDate,
  isValidISO,
} from '@/lib/dates'
import { newId } from '@/hooks/useLedgerState'
import { eventEnd, eventRawRange } from '@/lib/timeline'
import type { EventIndex, Timeline } from '@/lib/timeline'
import { MARKER_COLORS, colorHex } from '@/lib/types'
import type { LifeEvent, MarkerColor } from '@/lib/types'
import { btn, btnIcon, btnPrimary, input, labelCls } from './ui/Panel'

const TEMPLATES = [
  { name: '90-Day Sprint', title: '90-Day Sprint', end: (s: string) => addDays(s, 89) },
  { name: '1-Year Project', title: '1-Year Project', end: (s: string) => addDays(s, 364) },
  {
    name: '5-Year Chapter',
    title: '5-Year Chapter',
    end: (s: string) => addDays(addYears(s, 5), -1),
  },
]

interface Props {
  tl: Timeline
  events: LifeEvent[]
  evIdx: EventIndex
  passed: ReadonlySet<number>
  focusSignal: number
  focusEventId: string | null
  onFocusEvent: (id: string | null) => void
  onAdd: (e: LifeEvent) => void
  onUpdate: (id: string, patch: Partial<LifeEvent>) => void
  onDelete: (id: string) => void
}

export function EventManager({
  tl,
  events,
  evIdx,
  passed,
  focusSignal,
  focusEventId,
  onFocusEvent,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const today = tl.today
  const titleRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(addDays(today, 89))
  const [ongoing, setOngoing] = useState(false)
  const [color, setColor] = useState<MarkerColor>('lapis')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  useEffect(() => {
    if (focusSignal === 0) return
    titleRef.current?.focus()
    titleRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focusSignal])

  const valid = isValidISO(start) && (ongoing ? start <= today : isValidISO(end) && end >= start)
  const invalidMsg = ongoing
    ? 'An ongoing event must start today or earlier.'
    : 'End must be on or after start.'
  const draft = { start, end: ongoing ? undefined : end }
  const [a, b] = valid ? eventRawRange(tl, draft) : [0, -1]
  const weeks = Math.max(0, b - a + 1)
  const days = valid ? daysBetween(start, eventEnd(draft, today)) + 1 : 0

  const reset = () => {
    setEditing(null)
    setTitle('')
    setNote('')
    setError('')
    setStart(today)
    setEnd(addDays(today, 89))
    setOngoing(false)
    setColor(MARKER_COLORS[events.length % MARKER_COLORS.length].key)
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!title.trim()) return setError('Give the event a title.')
    if (!valid)
      return setError(
        ongoing
          ? 'Choose a start date of today or earlier.'
          : 'Choose a valid start and an end on or after it.',
      )
    const patch = {
      title: title.trim(),
      start,
      end: ongoing ? undefined : end,
      color,
      note: note.trim() || undefined,
    }
    if (editing) onUpdate(editing, patch)
    else onAdd({ id: newId(), visible: true, ...patch })
    reset()
  }

  const edit = (e: LifeEvent) => {
    setEditing(e.id)
    setTitle(e.title)
    setStart(e.start)
    setEnd(e.end ?? addDays(e.start > today ? e.start : today, 89))
    setOngoing(!e.end)
    setColor(e.color)
    setNote(e.note ?? '')
    setError('')
    titleRef.current?.focus()
  }

  return (
    <div className="p-4">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="ev-title" className={labelCls}>
            {editing ? 'Edit event' : 'New life event'}
          </label>
          <input
            id="ev-title"
            ref={titleRef}
            className={input}
            placeholder="e.g. Write the book"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="ev-start" className={labelCls}>
              Start
            </label>
            <input
              id="ev-start"
              type="date"
              className={`${input} num`}
              value={start}
              max={ongoing ? today : undefined}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="ev-end" className={labelCls}>
              End
            </label>
            {ongoing ? (
              <input
                id="ev-end"
                type="text"
                className={`${input} num`}
                value="Present"
                readOnly
                aria-readonly
              />
            ) : (
              <input
                id="ev-end"
                type="date"
                className={`${input} num`}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input type="checkbox" checked={ongoing} onChange={(e) => setOngoing(e.target.checked)} />
          Ongoing (no end date yet)
        </label>
        <p className="num text-xs text-slate-600" aria-live="polite">
          {valid ? (
            <>
              {ongoing && 'So far: '}
              {fmtInt(days)} days · {fmtInt(weeks)} wks · {((weeks / TOTAL_WEEKS) * 100).toFixed(2)}
              % of 4,000
            </>
          ) : (
            invalidMsg
          )}
        </p>
        <fieldset>
          <legend className={labelCls}>Color</legend>
          <div className="flex gap-2">
            {MARKER_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-label={c.name}
                aria-pressed={color === c.key}
                onClick={() => setColor(c.key)}
                className={`h-7 w-7 rounded-md border-2 ${color === c.key ? 'border-slate-900 ring-2 ring-white ring-inset' : 'border-transparent'}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="ev-note" className={labelCls}>
            Note (optional)
          </label>
          <textarea
            id="ev-note"
            rows={2}
            className={input}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-rose-700">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" className={btnPrimary}>
            {editing ? 'Save changes' : 'Add event'}
          </button>
          {editing && (
            <button type="button" className={btn} onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <p className="mb-2 text-xs font-medium text-slate-600">Templates, starting today</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              className={`${btn} !text-xs`}
              onClick={() => {
                setEditing(null)
                setTitle(t.title)
                setStart(today)
                setEnd(t.end(today))
                setOngoing(false)
                setError('')
                titleRef.current?.focus()
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <h3 className="mb-2 text-sm font-semibold">
          Your events <span className="num font-normal text-slate-500">({events.length})</span>
        </h3>
        {events.length === 0 && (
          <p className="text-sm text-slate-500">
            Nothing mapped yet. Events paint their weeks onto the grid.
          </p>
        )}
        <ul className="divide-y divide-slate-200">
          {events.map((e) => {
            const info = evIdx.perEvent[e.id] ?? { weeks: 0, raw: 0 }
            const [ea, eb] = eventRawRange(tl, e)
            let done = 0
            for (let i = Math.max(0, ea); i <= Math.min(tl.total - 1, eb); i++)
              if (passed.has(tl.startWeekId + i)) done++
            const pct = info.weeks ? (done / info.weeks) * 100 : 0
            const focused = focusEventId === e.id
            return (
              <li key={e.id} className={`py-3 ${e.visible ? '' : 'opacity-60'}`}>
                <div className="flex items-start gap-2">
                  <span
                    className="mt-1 inline-block h-3 w-3 shrink-0 rounded-sm"
                    style={{ background: colorHex(e.color) }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.title}</p>
                    <p className="num text-xs text-slate-500">
                      {formatDate(e.start)} to {e.end ? formatDate(e.end) : 'present'}
                    </p>
                    <p className="num text-xs text-slate-500">
                      {fmtInt(info.raw)} wks · {((info.raw / TOTAL_WEEKS) * 100).toFixed(2)}% of
                      4,000
                    </p>
                    {e.note && <p className="mt-1 text-xs text-slate-600">{e.note}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-sm bg-slate-200"
                        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- custom-styled bar; <progress> styling is not portable
                        role="progressbar"
                        aria-label={`${e.title} progress`}
                        aria-valuenow={Math.round(pct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full"
                          style={{ width: `${pct}%`, background: colorHex(e.color) }}
                        />
                      </div>
                      <span className="num text-[11px] text-slate-500">
                        {pct.toFixed(0)}% passed
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 pl-5">
                  <button
                    type="button"
                    className={`${btnIcon} ${focused ? '!border-slate-900 !bg-slate-900 !text-white' : ''}`}
                    aria-pressed={focused}
                    aria-label={`Focus ${e.title} on the grid`}
                    title="Focus on grid (dims other cells)"
                    onClick={() => onFocusEvent(focused ? null : e.id)}
                  >
                    <Crosshair size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={btnIcon}
                    aria-pressed={e.visible}
                    aria-label={e.visible ? `Hide ${e.title}` : `Show ${e.title}`}
                    title={e.visible ? 'Hide' : 'Show'}
                    onClick={() => onUpdate(e.id, { visible: !e.visible })}
                  >
                    {e.visible ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
                  </button>
                  <button
                    type="button"
                    className={btnIcon}
                    aria-label={`Edit ${e.title}`}
                    title="Edit"
                    onClick={() => edit(e)}
                  >
                    <Pencil size={15} aria-hidden />
                  </button>
                  {confirmDel === e.id ? (
                    <span className="ml-1 inline-flex items-center gap-2 text-xs text-rose-900">
                      Delete?
                      <button
                        type="button"
                        className="font-semibold underline"
                        onClick={() => {
                          onDelete(e.id)
                          if (focused) onFocusEvent(null)
                          setConfirmDel(null)
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="underline"
                        onClick={() => setConfirmDel(null)}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={btnIcon}
                      aria-label={`Delete ${e.title}`}
                      title="Delete"
                      onClick={() => setConfirmDel(e.id)}
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
