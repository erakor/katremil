"use client";

import { formatRange } from "@/lib/dates";
import { rowLabel, weekEnd, weekStart } from "@/lib/timeline";
import type { EventIndex, Timeline } from "@/lib/timeline";
import type { LifeEvent, Milestone } from "@/lib/types";
import { colorHex } from "@/lib/types";
import { WEEKS_PER_ROW } from "@/lib/dates";

export function WeekInspector({
  tl,
  idx,
  passed,
  events,
  evIdx,
  msIdx,
}: {
  tl: Timeline;
  idx: number | null;
  passed: ReadonlySet<number>;
  events: LifeEvent[];
  evIdx: EventIndex;
  msIdx: Map<number, Milestone[]>;
}) {
  if (idx === null || idx < 0 || idx >= tl.total) {
    return (
      <div className="num border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500" aria-live="polite">
        Hover, tap or focus a week to inspect it.
      </div>
    );
  }
  const isPassed = passed.has(tl.startWeekId + idx);
  const isCurrent = idx === tl.todayIdx;
  const evs = (evIdx.byWeek[idx] ?? []).map((k) => events[k]);
  const ms = msIdx.get(idx) ?? [];
  const row = Math.floor(idx / WEEKS_PER_ROW);
  const status = isCurrent ? "Current week" : isPassed ? "Passed" : "Remaining";
  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2" aria-live="polite" data-testid="inspector">
      <div className="num flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
        <span className="text-sm font-semibold">Week {idx + 1}</span>
        <span>{formatRange(weekStart(tl, idx), weekEnd(tl, idx))}</span>
        <span className="text-slate-500">{rowLabel(tl, row)}</span>
        <span className="font-semibold text-slate-800">{status}</span>
      </div>
      {(evs.length > 0 || ms.length > 0) && (
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
          {evs.map((e) => (
            <li key={e.id} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: colorHex(e.color) }} aria-hidden />
              {e.title}
            </li>
          ))}
          {ms.map((m) => (
            <li key={m.id} className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rotate-45 border border-slate-900 bg-white" aria-hidden />
              Milestone: {m.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
