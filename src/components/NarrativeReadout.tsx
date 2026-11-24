'use client'

import { useEffect, useState } from 'react'
import type { Readout } from '@/lib/narrative'

/** Fixed height so the grid below never jumps. Screen readers get a calmer, delayed copy. */
export function NarrativeReadout({
  readout,
  onCycleUnit,
}: {
  readout: Readout
  onCycleUnit: () => void
}) {
  const [spoken, setSpoken] = useState(readout)
  useEffect(() => {
    const t = setTimeout(() => setSpoken(readout), 700)
    return () => clearTimeout(t)
  }, [readout])

  const heard = [spoken.figure, spoken.lead, spoken.remaining, spoken.detail]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex h-[6.5rem] items-center gap-4 px-5 sm:h-[5.5rem]">
      {readout.figure && (
        <p
          aria-hidden="true"
          className="font-display shrink-0 text-4xl leading-none text-amber tabular-nums sm:text-5xl"
        >
          {readout.figure}
        </p>
      )}
      <div className="flex min-w-0 flex-col justify-center gap-1.5">
        <p aria-hidden="true" className="font-display text-lg leading-snug text-ink sm:text-2xl">
          {readout.lead}
        </p>
        <p className="num flex min-w-0 items-baseline gap-x-2 text-xs text-muted sm:text-[13px]">
          {readout.remaining && (
            <button
              type="button"
              onClick={onCycleUnit}
              title="Switch between weeks, years, months and days"
              aria-label={`${readout.remaining}. Switch unit.`}
              className="shrink-0 rounded-sm text-ink underline decoration-dotted underline-offset-4 hover:decoration-solid"
            >
              {readout.remaining}
            </button>
          )}
          <span aria-hidden="true" className="truncate">
            {readout.detail}
          </span>
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {heard}
      </p>
    </div>
  )
}
