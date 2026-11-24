'use client'

import { useEffect, useRef } from 'react'

/** The opening note. A native dialog gives focus trapping and Escape for free. */
export function Intro({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="intro-title"
      className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-xl border border-hairline bg-panel p-0 text-ink backdrop:bg-black/60 backdrop:backdrop-blur-[2px]"
    >
      <div className="space-y-4 px-6 py-6 sm:px-8 sm:py-8">
        <p className="num text-[11px] tracking-[0.14em] text-muted uppercase">Before you look</p>
        <h2 id="intro-title" className="font-display text-3xl leading-tight">
          Why four thousand?
        </h2>
        <div className="space-y-3 text-[15px] leading-relaxed text-ink/85">
          <p>
            Oliver Burkeman&rsquo;s <em>Four Thousand Weeks</em> starts from plain arithmetic: a
            long life is about four thousand weeks. Seeing the count laid out does not make it
            smaller, but it does make it real.
          </p>
          <p>
            The point is not to optimise every week. It is to stop pretending the supply is endless,
            to choose a few things worth the weeks they cost, and to accept the rest as the price of
            being finite. Each square here is one of those weeks.
          </p>
          <p className="text-muted">
            The book rounds to four thousand. This grid draws eighty years of fifty-two weeks, so it
            holds 4,160. There is nothing to log and nothing to plan. Look, move the pointer, and
            let the numbers do the arguing.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            // Closing the dialog fires its `close` event, the single path to onClose.
            onClick={() => ref.current?.close()}
            autoFocus
            className="rounded-md border border-amber bg-amber/15 px-4 py-2 text-sm font-medium text-amber transition-colors hover:bg-amber/25"
          >
            Show me my weeks
          </button>
        </div>
      </div>
    </dialog>
  )
}
