"use client";

import { memo } from "react";
import { WEEKS_PER_ROW } from "@/lib/dates";
import type { CellData, RowData } from "@/lib/timeline";

const HATCH = "repeating-linear-gradient(135deg, rgba(15,23,42,.6) 0 1px, transparent 1px 3px)";
const SHADE = "linear-gradient(rgba(15,23,42,.3), rgba(15,23,42,.3))";

function cellImage(c: CellData): string | undefined {
  let base: string | undefined;
  const n = c.colors.length;
  if (n === 1) base = `linear-gradient(${c.colors[0]}, ${c.colors[0]})`;
  else if (n > 1) {
    const stops = c.colors.map((col, i) => `${col} ${(i * 100) / n}% ${((i + 1) * 100) / n}%`).join(", ");
    base = `linear-gradient(135deg, ${stops})`;
  }
  if (c.passed) return `${HATCH}, ${SHADE}, ${base ?? "linear-gradient(#94A3B8, #94A3B8)"}`;
  return base;
}

interface Props {
  data: RowData;
  decade: boolean;
  /** Column of the roving-tabindex cell in this row, or -1. */
  focusCol: number;
  showRail: boolean;
  flash: boolean;
}

function GridRowImpl({ data, decade, focusCol, showRail, flash }: Props) {
  const first = data.index * WEEKS_PER_ROW;
  const showLabel = data.index % 5 === 0;
  return (
    <div
      role="row"
      aria-rowindex={data.index + 1}
      className={`flex items-center gap-2 ${decade ? "decade-sep" : ""} ${flash ? "row-flash" : ""}`}
    >
      <div className="num w-[4.25rem] shrink-0 whitespace-nowrap text-right text-[10px] leading-none text-slate-500 sm:w-24 sm:text-[11px]" aria-hidden={!showLabel}>
        {showLabel ? data.label : ""}
      </div>
      <div className="grid min-w-0 flex-1 gap-[2px] [.grid-compact_&]:gap-px" style={{ gridTemplateColumns: `repeat(${WEEKS_PER_ROW}, minmax(0, 1fr))` }}>
        {data.cells.map((c, col) => {
          const img = cellImage(c);
          return (
            <div
              key={col}
              role="gridcell"
              data-week={first + col}
              tabIndex={col === focusCol ? 0 : -1}
              aria-selected={c.passed}
              aria-label={`Week ${first + col + 1}${c.passed ? ", passed" : ""}${c.current ? ", current" : ""}${c.ms ? ", milestone" : ""}`}
              className={`cell${c.dim ? " cell-dim" : ""}${c.current ? " cell-current" : ""}`}
              style={img ? { backgroundImage: img } : undefined}
            >
              {c.ms && <span className="ms-diamond" />}
            </div>
          );
        })}
      </div>
      {showRail && (
        <div className="hidden w-32 shrink-0 truncate text-[11px] text-slate-700 md:block" title={data.rail}>
          {data.rail && (
            <>
              <span aria-hidden className="mr-1 inline-block h-1.5 w-1.5 rotate-45 bg-slate-900" />
              {data.rail}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export const GridRow = memo(
  GridRowImpl,
  (a, b) =>
    a.data.sig === b.data.sig &&
    a.decade === b.decade &&
    a.focusCol === b.focusCol &&
    a.showRail === b.showRail &&
    a.flash === b.flash,
);
