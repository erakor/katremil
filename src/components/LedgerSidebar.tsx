'use client'

import { Segmented } from './ui/Segmented'

export type SidebarTab = 'events' | 'milestones'

export function LedgerSidebar({
  tab,
  onTab,
  children,
}: {
  tab: SidebarTab
  onTab: (t: SidebarTab) => void
  children: React.ReactNode
}) {
  return (
    <aside
      id="events"
      aria-label="Events and milestones"
      className="rounded-lg border border-slate-200 bg-white shadow-sm lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto"
    >
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-3">
        <Segmented<SidebarTab>
          ariaLabel="Sidebar section"
          full
          value={tab}
          onChange={onTab}
          options={[
            { value: 'events', label: 'Life Events' },
            { value: 'milestones', label: 'Milestones' },
          ]}
        />
      </div>
      {children}
    </aside>
  )
}
