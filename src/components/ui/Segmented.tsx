'use client'

import type { ReactNode } from 'react'

export interface SegOption<T extends string> {
  value: T
  label: ReactNode
  title?: string
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  full = false,
}: {
  value: T
  onChange: (v: T) => void
  options: SegOption<T>[]
  ariaLabel: string
  full?: boolean
}) {
  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- button group; fieldset would add default border and legend semantics
      role="group"
      aria-label={ariaLabel}
      className={`${full ? 'flex w-full' : 'inline-flex'} rounded-md border border-hairline bg-white/[0.03] p-0.5`}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`${full ? 'flex-1' : ''} rounded px-2.5 py-1 text-sm font-medium whitespace-nowrap transition-colors ${
              on ? 'bg-white/10 text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
