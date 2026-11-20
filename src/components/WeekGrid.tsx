"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { WEEKS_PER_ROW } from "@/lib/dates";
import type { EventIndex, RowData, Timeline } from "@/lib/timeline";
import type { Config, Density, Highlight, LifeEvent, Milestone } from "@/lib/types";
import { GridRow } from "./GridRow";
import { WeekInspector } from "./WeekInspector";
import { Panel } from "./ui/Panel";
import { Segmented } from "./ui/Segmented";

interface Props {
  tl: Timeline;
  rows: RowData[];
  config: Config;
  passed: ReadonlySet<number>;
  events: LifeEvent[];
  evIdx: EventIndex;
  msIdx: Map<number, Milestone[]>;
  flashRow: number;
  setWeeks: (ids: number[], value: boolean) => void;
  setConfig: (p: Partial<Pick<Config, "showLabels" | "density" | "highlight">>) => void;
}

const weekOf = (el: Element | null): number | null => {
  const c = el?.closest?.("[data-week]");
  return c ? Number(c.getAttribute("data-week")) : null;
};

export function WeekGrid({ tl, rows, config, passed, events, evIdx, msIdx, flashRow, setWeeks, setConfig }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const drag = useRef<{ value: boolean; last: number } | null>(null);
  const touch = useRef<{ x: number; y: number; week: number; moved: boolean } | null>(null);
  const anchor = useRef<number | null>(null);

  const latest = useRef({ tl, passed, setWeeks });
  useLayoutEffect(() => {
    latest.current = { tl, passed, setWeeks };
  });

  const isPassed = (i: number) => latest.current.passed.has(latest.current.tl.startWeekId + i);
  const idsFor = (a: number, b: number) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const base = latest.current.tl.startWeekId;
    const out: number[] = [];
    for (let i = lo; i <= hi; i++) out.push(base + i);
    return out;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const week = weekOf(e.target as Element);
    if (week === null) return;
    setFocusIdx(week);
    setSelected(week);
    if (e.pointerType === "mouse") {
      e.preventDefault();
      gridRef.current?.querySelector<HTMLElement>(`[data-week="${week}"]`)?.focus({ preventScroll: true });
      if (e.shiftKey && anchor.current !== null) {
        const value = isPassed(anchor.current);
        latest.current.setWeeks(idsFor(anchor.current, week), value);
        anchor.current = week;
        return;
      }
      const value = !isPassed(week);
      latest.current.setWeeks(idsFor(week, week), value);
      drag.current = { value, last: week };
      anchor.current = week;
      e.currentTarget.setPointerCapture(e.pointerId);
    } else {
      // Touch and pen: wait for pointerup so a scroll gesture never toggles a cell.
      touch.current = { x: e.clientX, y: e.clientY, week, moved: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") {
      const w = weekOf(document.elementFromPoint(e.clientX, e.clientY));
      if (drag.current) {
        if (w !== null && w !== drag.current.last) {
          const last = drag.current.last;
          const sameRow = Math.floor(w / WEEKS_PER_ROW) === Math.floor(last / WEEKS_PER_ROW);
          latest.current.setWeeks(sameRow ? idsFor(last, w) : idsFor(w, w), drag.current.value);
          drag.current.last = w;
        }
      } else setHover((h) => (h === w ? h : w));
    } else if (touch.current && Math.hypot(e.clientX - touch.current.x, e.clientY - touch.current.y) > 6) {
      touch.current.moved = true;
    }
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>, commit: boolean) => {
    drag.current = null;
    const t = touch.current;
    touch.current = null;
    if (commit && t && !t.moved && e.pointerType !== "mouse") {
      latest.current.setWeeks(idsFor(t.week, t.week), !isPassed(t.week));
      anchor.current = t.week;
    }
  };

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const cur = weekOf(e.target as Element);
      if (cur === null) return;
      let next = cur;
      const total = latest.current.tl.total;
      switch (e.key) {
        case "ArrowLeft": next = cur - 1; break;
        case "ArrowRight": next = cur + 1; break;
        case "ArrowUp": next = cur - WEEKS_PER_ROW; break;
        case "ArrowDown": next = cur + WEEKS_PER_ROW; break;
        case "Home": next = cur - (cur % WEEKS_PER_ROW); break;
        case "End": next = cur - (cur % WEEKS_PER_ROW) + WEEKS_PER_ROW - 1; break;
        case "PageUp": next = cur - WEEKS_PER_ROW * 10; break;
        case "PageDown": next = cur + WEEKS_PER_ROW * 10; break;
        case "Enter":
        case " ":
          e.preventDefault();
          latest.current.setWeeks(idsFor(cur, cur), !isPassed(cur));
          anchor.current = cur;
          return;
        default:
          return;
      }
      e.preventDefault();
      next = Math.max(0, Math.min(total - 1, next));
      setFocusIdx(next);
      setSelected(next);
      requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>(`[data-week="${next}"]`)?.focus());
    },
    [],
  );

  const fi = Math.min(focusIdx, tl.total - 1);
  const focusRow = Math.floor(fi / WEEKS_PER_ROW);
  const showRail = config.showLabels;
  const inspect = hover ?? selected ?? (tl.todayIdx >= 0 && tl.todayIdx < tl.total ? tl.todayIdx : null);

  return (
    <Panel
      id="grid"
      title="Week grid"
      eyebrow={`${tl.total.toLocaleString("en-US")} weeks · ${tl.rows} rows`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<Highlight>
            ariaLabel="Highlight"
            value={config.highlight}
            onChange={(highlight) => setConfig({ highlight })}
            options={[
              { value: "all", label: "All" },
              { value: "remaining", label: "Remaining" },
              { value: "events", label: "Events" },
            ]}
          />
          <Segmented<Density>
            ariaLabel="Density"
            value={config.density}
            onChange={(density) => setConfig({ density })}
            options={[
              { value: "standard", label: "Standard" },
              { value: "compact", label: "Compact" },
            ]}
          />
          <button
            type="button"
            aria-pressed={config.showLabels}
            onClick={() => setConfig({ showLabels: !config.showLabels })}
            className={`rounded-md border px-2.5 py-1 text-sm font-medium ${
              config.showLabels ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Milestone labels
          </button>
        </div>
      }
    >
      <div className="sticky top-14 z-20 rounded-t-lg bg-white">
        <WeekInspector tl={tl} idx={inspect} passed={passed} events={events} evIdx={evIdx} msIdx={msIdx} />
      </div>
      <div className="overflow-x-auto px-3 pb-4 pt-3 sm:px-4">
        <div
          ref={gridRef}
          role="grid"
          aria-label="Life in weeks"
          aria-rowcount={tl.rows}
          aria-colcount={WEEKS_PER_ROW}
          className={`select-none-grid min-w-[640px] sm:min-w-0 ${config.density === "compact" ? "grid-compact" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endPointer(e, true)}
          onPointerCancel={(e) => endPointer(e, false)}
          onLostPointerCapture={() => (drag.current = null)}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKeyDown}
          onFocus={(e) => {
            const w = weekOf(e.target as Element);
            if (w !== null) {
              setFocusIdx(w);
              setSelected(w);
            }
          }}
        >
          <div className="mb-1 flex items-end gap-2 text-[10px] text-slate-500" aria-hidden>
            <div className="w-[4.25rem] shrink-0 sm:w-24" />
            <div className="num relative h-3 min-w-0 flex-1">
              {[1, 14, 27, 52].map((w) => (
                <span
                  key={w}
                  className="absolute top-0"
                  style={{ left: `${((w - 0.5) / WEEKS_PER_ROW) * 100}%`, transform: "translateX(-50%)" }}
                >
                  {w === 1 ? "Wk 1" : w}
                </span>
              ))}
            </div>
            {showRail && <div className="hidden w-32 shrink-0 md:block" />}
          </div>
          {rows.map((r) => (
            <GridRow
              key={r.index}
              data={r}
              decade={r.index > 0 && r.index % 10 === 0}
              focusCol={r.index === focusRow ? fi % WEEKS_PER_ROW : -1}
              showRail={showRail}
              flash={flashRow === r.index}
            />
          ))}
        </div>
      </div>
      <div className="num flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-600">
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-sm bg-slate-200" /> Remaining</span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: "#94A3B8", backgroundImage: "repeating-linear-gradient(135deg, rgba(15,23,42,.6) 0 1px, transparent 1px 3px)" }} /> Passed (hatched)
        </span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-sm bg-slate-200 outline outline-2 outline-offset-1 outline-lapis" /> Current week</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rotate-45 border-[1.5px] border-slate-900 bg-white" /> Milestone</span>
        <span>Drag to paint · Shift+Click for a range · Arrows + Space on keyboard</span>
      </div>
    </Panel>
  );
}
