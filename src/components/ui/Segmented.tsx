"use client";

import type { ReactNode } from "react";

export interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  full = false,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegOption<T>[];
  ariaLabel: string;
  full?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`${full ? "flex w-full" : "inline-flex"} rounded-md border border-slate-300 bg-slate-100 p-0.5`}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`${full ? "flex-1" : ""} rounded px-2.5 py-1 text-sm font-medium transition-colors ${
              on ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
