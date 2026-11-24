'use client'

import { PIGMENTS } from '@/lib/pigments'
import type { PigmentKey } from '@/lib/pigments'
import type { ChapterShare } from '@/lib/chapterShare'
import type { Chapter } from '@/lib/life'
import { shareLine } from '@/lib/narrative'
import { addYears, isValidISO } from '@/lib/dates'

const field = 'num w-full rounded border border-hairline bg-white/[0.03] px-2 py-1 text-xs text-ink'

export function ChapterEditor({
  chapters,
  shares,
  birthISO,
  isSample,
  onChange,
}: {
  chapters: Chapter[]
  /** Same order as `chapters`. */
  shares: (ChapterShare | null)[]
  birthISO: string
  isSample: boolean
  onChange: (next: Chapter[]) => void
}) {
  const patch = (id: string, p: Partial<Chapter>) =>
    onChange(chapters.map((c) => (c.id === id ? { ...c, ...p } : c)))

  const add = () => {
    const last = chapters[chapters.length - 1]
    const start = last?.endISO ? last.endISO : addYears(birthISO, 20)
    onChange([
      ...chapters,
      {
        id: crypto.randomUUID(),
        label: 'New chapter',
        startISO: start,
        pigment: PIGMENTS[chapters.length % PIGMENTS.length].key,
      },
    ])
  }

  return (
    <details className="group">
      <summary className="cursor-pointer text-sm text-muted select-none hover:text-ink">
        Edit chapters
        {isSample && <span className="ml-2 text-[11px]">(changes become yours)</span>}
      </summary>
      <ul className="mt-3 space-y-4">
        {chapters.map((c, k) => (
          <li key={c.id} className="space-y-2 border-l border-hairline pl-3">
            <input
              aria-label="Chapter name"
              value={c.label}
              maxLength={80}
              onChange={(e) => patch(c.id, { label: e.target.value })}
              className="w-full rounded border border-hairline bg-white/[0.03] px-2 py-1 text-sm text-ink"
            />
            {shares[k] && (
              <p className="num text-[11px] text-muted" title="Share of your life">
                {shareLine(shares[k], true)}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] text-muted">
                From
                <input
                  type="date"
                  value={c.startISO}
                  max={c.endISO}
                  onChange={(e) =>
                    isValidISO(e.target.value) &&
                    patch(c.id, {
                      startISO: e.target.value,
                      // Keep the chapter valid: a start past the end drags the end along.
                      ...(c.endISO !== undefined && c.endISO < e.target.value
                        ? { endISO: e.target.value }
                        : {}),
                    })
                  }
                  className={field}
                />
              </label>
              <label className="text-[11px] text-muted">
                To
                <input
                  type="date"
                  value={c.endISO ?? ''}
                  disabled={c.endISO === undefined}
                  min={c.startISO}
                  onChange={(e) =>
                    isValidISO(e.target.value) &&
                    e.target.value >= c.startISO &&
                    patch(c.id, { endISO: e.target.value })
                  }
                  className={`${field} disabled:opacity-40`}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={c.endISO === undefined}
                  onChange={(e) =>
                    patch(c.id, { endISO: e.target.checked ? undefined : addYears(c.startISO, 1) })
                  }
                />
                Ongoing
              </label>
              <fieldset className="flex gap-1" aria-label="Pigment">
                {PIGMENTS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={c.pigment === p.key}
                    aria-label={p.name}
                    title={p.name}
                    onClick={() => patch(c.id, { pigment: p.key as PigmentKey })}
                    className={`size-4 rounded-sm ${c.pigment === p.key ? 'ring-2 ring-ink' : ''}`}
                    style={{ background: p.hex }}
                  />
                ))}
              </fieldset>
              <button
                type="button"
                onClick={() => onChange(chapters.filter((x) => x.id !== c.id))}
                className="text-xs text-muted hover:text-ink"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="mt-3 rounded border border-hairline px-2.5 py-1 text-xs text-ink hover:bg-white/5"
      >
        Add chapter
      </button>
    </details>
  )
}
