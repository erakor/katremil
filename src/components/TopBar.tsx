'use client'

import { Plus } from 'lucide-react'
import { btnPrimary } from './ui/Panel'

const LINKS = [
  ['progress', 'Progress'],
  ['grid', 'Grid'],
  ['events', 'Events'],
  ['analytics', 'Analytics'],
  ['philosophy', 'Philosophy'],
] as const

export function TopBar({ onAddEvent }: { onAddEvent: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#progress" className="flex items-baseline gap-2">
          <span className="font-display whitespace-nowrap text-base font-semibold tracking-tight sm:text-lg">
            Four Thousand Weeks
          </span>
          <span className="num hidden text-[11px] uppercase tracking-wider text-slate-500 sm:inline">
            Life ledger
          </span>
        </a>
        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {LINKS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-md px-2.5 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={onAddEvent}
          className={`${btnPrimary} shrink-0`}
          aria-label="Add Life Event"
        >
          <Plus size={16} aria-hidden />{' '}
          <span className="whitespace-nowrap">
            <span className="sm:hidden">Add Event</span>
            <span className="hidden sm:inline">Add Life Event</span>
          </span>
        </button>
      </div>
    </header>
  )
}
