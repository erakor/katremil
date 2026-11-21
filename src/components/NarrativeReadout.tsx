'use client'

import { useEffect, useState } from 'react'
import type { Readout } from '@/lib/narrative'

/** Fixed height so the grid below never jumps. Screen readers get a calmer, delayed copy. */
export function NarrativeReadout({ readout }: { readout: Readout }) {
  const [spoken, setSpoken] = useState(readout)
  useEffect(() => {
    const t = setTimeout(() => setSpoken(readout), 700)
    return () => clearTimeout(t)
  }, [readout])

  return (
    <div className="flex h-[6.5rem] flex-col justify-center gap-1.5 px-5 sm:h-[5.5rem]">
      <p aria-hidden="true" className="font-display text-xl leading-snug text-ink sm:text-2xl">
        {readout.lead}
      </p>
      <p aria-hidden="true" className="num truncate text-xs text-muted sm:text-[13px]">
        {readout.detail}
      </p>
      <p className="sr-only" aria-live="polite">
        {spoken.lead} {spoken.detail}
      </p>
    </div>
  )
}
