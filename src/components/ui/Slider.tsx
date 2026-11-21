'use client'

import { useId } from 'react'

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = String,
  ends,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  /** Captions under the left and right ends of the track. */
  ends?: [string, string]
}) {
  const id = useId()
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        <span className="num text-xs text-ink">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block w-full"
      />
      {ends && (
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </div>
      )}
    </div>
  )
}
