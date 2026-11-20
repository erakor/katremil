"use client";

import { DAYS_PER_MONTH, SOLAR_WEEKS_PER_YEAR, TOTAL_WEEKS, fmtInt, formatDate, formatYearsWeeks } from "@/lib/dates";
import { inGrid, weekStart } from "@/lib/timeline";
import type { Timeline } from "@/lib/timeline";

function Cell({ label, big, lines }: { label: string; big: string; lines: string[] }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="num mt-1 text-xl font-medium leading-tight">{big}</p>
      {lines.map((l) => (
        <p key={l} className="num text-xs text-slate-500">
          {l}
        </p>
      ))}
    </div>
  );
}

export function LedgerStats({ tl, passed, mapped, hasEvents }: { tl: Timeline; passed: number; mapped: number; hasEvents: boolean }) {
  const remaining = tl.total - passed;
  const days = remaining * 7;
  const lived = tl.elapsedBeforeStart + passed;
  const nextMark = Math.min(TOTAL_WEEKS, (Math.floor(lived / 1000) + 1) * 1000);
  const markIdx = nextMark - tl.elapsedBeforeStart;
  const markDate = inGrid(tl, markIdx) ? formatDate(weekStart(tl, markIdx)) : "end of the grid";
  const footprint = (mapped / tl.total) * 100;

  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-4 lg:divide-y-0">
      <Cell
        label="Time remaining"
        big={formatYearsWeeks(remaining)}
        lines={[`${fmtInt(days / DAYS_PER_MONTH)} months`, `${fmtInt(days)} days`]}
      />
      <Cell
        label="Solar year"
        big={`${SOLAR_WEEKS_PER_YEAR.toFixed(2)} wks`}
        lines={["365.2425 days / 7", `${fmtInt(TOTAL_WEEKS)} wks = ${(TOTAL_WEEKS / SOLAR_WEEKS_PER_YEAR).toFixed(1)} yrs`]}
      />
      <Cell
        label="Next 1,000-week mark"
        big={`Wk ${fmtInt(nextMark)}`}
        lines={[`in ${fmtInt(Math.max(0, nextMark - lived))} wks`, markDate]}
      />
      {hasEvents ? (
        <Cell label="Event footprint" big={`${footprint.toFixed(1)}%`} lines={[`${fmtInt(mapped)} weeks mapped`, `${(100 - footprint).toFixed(1)}% open`]} />
      ) : (
        <Cell label="Open horizon" big="100.0%" lines={["No events mapped", "Add one to claim weeks"]} />
      )}
    </div>
  );
}
