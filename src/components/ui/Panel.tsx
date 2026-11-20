import type { ReactNode } from "react";

export function Panel({
  id,
  title,
  eyebrow,
  actions,
  children,
  className = "",
}: {
  id?: string;
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <div>
            {eyebrow && <p className="num text-[11px] uppercase tracking-wider text-slate-500">{eyebrow}</p>}
            {title && <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed";
export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-lapis bg-lapis px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800";
export const btnIcon =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900";
export const input =
  "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400";
export const labelCls = "mb-1 block text-xs font-medium text-slate-600";
