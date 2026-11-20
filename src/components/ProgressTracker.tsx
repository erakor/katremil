"use client";

import { Diamond } from "lucide-react";
import { TOTAL_WEEKS, fmtInt, formatDate, formatYearsWeeks } from "@/lib/dates";
import { milestoneStatus, weekEnd } from "@/lib/timeline";
import type { Timeline } from "@/lib/timeline";
import type { LifeEvent, Milestone } from "@/lib/types";
import { Panel, btn } from "./ui/Panel";

function Metric({ label, children, sub }: { label: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <div className="num mt-1 text-lg font-medium leading-tight">{children}</div>
      {sub && <p className="num mt-0.5 truncate text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function ProgressTracker({
  tl,
  passed,
  mapped,
  milestones,
  events,
  passedWeeks,
  onPinMilestone,
}: {
  tl: Timeline;
  passed: number;
  mapped: number;
  milestones: Milestone[];
  events: LifeEvent[];
  passedWeeks: ReadonlySet<number>;
  onPinMilestone: () => void;
}) {
  const pct = (passed / tl.total) * 100;
  const remaining = tl.total - passed;
  const overall = ((tl.elapsedBeforeStart + passed) / TOTAL_WEEKS) * 100;
  const spanStart = tl.startDate;
  const spanEnd = weekEnd(tl, tl.total - 1);
  const stats = milestones.map((m) => ({ m, ...milestoneStatus(tl, m, passedWeeks) }));
  const reached = stats.filter((s) => s.reached).length;
  const horizonLabel = tl.mode === "horizon" ? "Horizon" : tl.mode === "birthFull" ? "Lifespan" : "Remaining span";

  return (
    <Panel id="progress">
      <div className="px-4 pb-4 pt-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{horizonLabel} elapsed</p>
            <p className="num text-5xl font-medium leading-none tracking-tight text-lapis" aria-label={`${pct.toFixed(2)} percent`}>
              {pct.toFixed(2)}%
            </p>
          </div>
          <div className="num text-sm text-slate-600 sm:text-right">
            <p>
              <span className="font-semibold text-slate-900">{fmtInt(passed)}</span> / {fmtInt(tl.total)} weeks passed
            </p>
            <p className="text-xs text-slate-500">
              {formatDate(spanStart)} to {formatDate(spanEnd)}
            </p>
            {tl.mode === "birthRemaining" && (
              <p className="text-xs text-slate-500">{overall.toFixed(2)}% of all {fmtInt(TOTAL_WEEKS)} weeks</p>
            )}
          </div>
        </div>

        <div className="relative mt-5 pb-3 pt-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Number(pct.toFixed(2))}
            aria-label="Weeks passed"
            className="relative h-3 overflow-hidden rounded-sm bg-slate-200"
          >
            <div className="h-full bg-lapis" style={{ width: `${pct}%` }} />
            {[25, 50, 75].map((t) => (
              <span key={t} className="absolute top-0 h-full w-px bg-white/80" style={{ left: `${t}%` }} aria-hidden />
            ))}
          </div>
          {[25, 50, 75].map((t) => (
            <span key={t} className="num absolute bottom-[-2px] -translate-x-1/2 text-[10px] text-slate-400" style={{ left: `${t}%` }} aria-hidden>
              {t}
            </span>
          ))}
          {stats
            .filter((s) => s.m.visible && s.onGrid)
            .map((s) => (
              <span
                key={s.m.id}
                title={`${s.m.title} · ${formatDate(s.m.date)}`}
                className={`absolute top-[12px] h-3 w-3 border-2 border-slate-900 ${
                  s.reached ? "bg-slate-900" : "bg-white"
                }`}
                style={{ left: `${(s.idx / tl.total) * 100}%`, transform: "translateX(-50%) rotate(45deg)" }}
              />
            ))}
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 border-t border-slate-200 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        <Metric label="Passed">{fmtInt(passed)}</Metric>
        <Metric label="Remaining">{fmtInt(remaining)}</Metric>
        <Metric label="Remaining span">{formatYearsWeeks(remaining)}</Metric>
        <Metric label="Mapped to events" sub={events.length ? `${events.filter((e) => e.visible).length} visible` : "No events yet"}>
          {fmtInt(mapped)}
        </Metric>
        <Metric label="Milestones reached">
          {milestones.length === 0 ? (
            <button type="button" onClick={onPinMilestone} className={`${btn} !px-2 !py-1 !text-xs`}>
              <Diamond size={12} aria-hidden /> Pin a milestone
            </button>
          ) : (
            <span className="flex items-center gap-2">
              <span>
                {reached} / {milestones.length}
              </span>
              {milestones.length <= 8 && (
                <span className="flex items-center gap-1.5" aria-hidden>
                  {stats.map((s) => (
                    <span key={s.m.id} className={`inline-block h-2.5 w-2.5 rotate-45 border border-slate-900 ${s.reached ? "bg-slate-900" : "bg-white"}`} />
                  ))}
                </span>
              )}
            </span>
          )}
        </Metric>
      </div>
    </Panel>
  );
}
