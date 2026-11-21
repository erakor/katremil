'use client'

import { useEffect, useState } from 'react'
import { clearCustom, readRaw } from '@/lib/storage'

const btn =
  'rounded-md border border-hairline px-3 py-1.5 text-sm text-ink transition-colors hover:bg-white/5'

export default function VisualizerError({ error, retry }: { error: unknown; retry: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const saved = readRaw()

  useEffect(() => {
    console.error(error)
  }, [error])

  const download = () => {
    if (!saved) return
    const url = URL.createObjectURL(new Blob([saved], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'four-thousand-weeks-backup.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const reset = () => {
    clearCustom()
    location.reload()
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-16">
      <h1 className="font-display text-2xl">Something went wrong</h1>
      <p className="text-sm text-muted">
        The grid could not be drawn. Try again first. If it keeps failing, your saved life may be
        the cause: download a copy, then clear it to start fresh.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${btn} border-amber text-amber`} onClick={retry}>
          Try again
        </button>
        {saved && (
          <button type="button" className={btn} onClick={download}>
            Download saved data
          </button>
        )}
        {saved &&
          (confirming ? (
            <button type="button" className={btn} onClick={reset}>
              Confirm: clear saved data
            </button>
          ) : (
            <button type="button" className={btn} onClick={() => setConfirming(true)}>
              Clear saved data
            </button>
          ))}
      </div>
    </main>
  )
}
