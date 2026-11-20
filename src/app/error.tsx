'use client'

import { useEffect, useState } from 'react'
import { btn, btnPrimary } from '@/components/ui/Panel'
import { STORAGE_KEY } from '@/lib/storage'

function readSaved(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export default function LedgerError({ error, retry }: { error: unknown; retry: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const saved = readSaved()

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
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* nothing to clear */
    }
    location.reload()
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-16">
      <h1 className="font-display text-2xl">Something went wrong</h1>
      <p className="text-sm text-slate-600">
        The ledger could not be shown. Try again first. If it keeps failing, your saved data may be
        the cause: download a copy, then clear it to start fresh.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={retry}>
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
