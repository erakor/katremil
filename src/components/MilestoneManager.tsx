"use client";

import { useState } from "react";
import { Crosshair, Eye, EyeOff, MapPin, Pencil, Trash2 } from "lucide-react";
import { addYears, daysBetween, fmtInt, formatDate, formatYearsWeeks, isValidISO } from "@/lib/dates";
import { newId } from "@/hooks/useLedgerState";
import { milestoneStatus, weekIndexForDate, inGrid } from "@/lib/timeline";
import type { Timeline } from "@/lib/timeline";
import type { Milestone } from "@/lib/types";
import { btn, btnIcon, btnPrimary, input, labelCls } from "./ui/Panel";
import { Segmented } from "./ui/Segmented";

type InputKind = "years" | "date";

interface Props {
  tl: Timeline;
  milestones: Milestone[];
  passed: ReadonlySet<number>;
  onAdd: (m: Milestone) => void;
  onUpdate: (id: string, patch: Partial<Milestone>) => void;
  onDelete: (id: string) => void;
  onLocate: (weekIdx: number) => void;
}

export function MilestoneManager({ tl, milestones, passed, onAdd, onUpdate, onDelete, onLocate }: Props) {
  const birth = tl.mode !== "horizon";
  const yearsLabel = birth ? "Target age" : "Years from start";
  const [kind, setKind] = useState<InputKind>("years");
  const [title, setTitle] = useState("");
  const [years, setYears] = useState("40");
  const [date, setDate] = useState(tl.today);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const yearsNum = Number(years);
  const resolved: string | null =
    kind === "date"
      ? isValidISO(date) ? date : null
      : years.trim() !== "" && Number.isFinite(yearsNum) && yearsNum >= 0 && yearsNum <= 120
        ? addYears(tl.anchor, yearsNum)
        : null;
  const previewIdx = resolved ? weekIndexForDate(tl, resolved) : null;
  const diffDays = resolved ? daysBetween(tl.today, resolved) : 0;

  const presets = birth ? [30, 40, 50, 65, 80] : [1, 5, 10, 20];

  const reset = () => {
    setEditing(null);
    setTitle("");
    setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Give the milestone a title.");
    if (!resolved) return setError("Enter a valid target.");
    if (editing) onUpdate(editing, { title: title.trim(), date: resolved });
    else onAdd({ id: newId(), title: title.trim(), date: resolved, visible: true });
    reset();
  };

  return (
    <div className="p-4">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="ms-title" className={labelCls}>{editing ? "Edit milestone" : "New milestone"}</label>
          <input id="ms-title" className={input} value={title} placeholder="e.g. Half a century" maxLength={80} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <Segmented<InputKind>
          ariaLabel="Milestone input"
          full
          value={kind}
          onChange={setKind}
          options={[
            { value: "years", label: yearsLabel },
            { value: "date", label: "Calendar date" },
          ]}
        />
        {kind === "years" ? (
          <div>
            <label htmlFor="ms-years" className={labelCls}>{yearsLabel}</label>
            <input id="ms-years" type="number" min={0} max={120} step="0.5" className={`${input} num`} value={years} onChange={(e) => setYears(e.target.value)} />
          </div>
        ) : (
          <div>
            <label htmlFor="ms-date" className={labelCls}>Date</label>
            <input id="ms-date" type="date" className={`${input} num`} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}
        <div className="flex flex-wrap gap-1.5" aria-label="Presets">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className={`${btn} num !px-2 !py-1 !text-xs`}
              onClick={() => {
                setKind("years");
                setYears(String(p));
                if (!title.trim()) setTitle(birth ? `Age ${p}` : `Year ${p}`);
              }}
            >
              {birth ? `Age ${p}` : `+${p} yr`}
            </button>
          ))}
        </div>
        <div className="num rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700" aria-live="polite">
          {resolved && previewIdx !== null ? (
            <>
              <p className="font-semibold">{formatDate(resolved)}</p>
              <p>
                {diffDays === 0 ? "Today" : diffDays > 0 ? `In ${formatYearsWeeks(diffDays / 7)}` : `${formatYearsWeeks(-diffDays / 7)} ago`}
                {" · "}
                {inGrid(tl, previewIdx) ? `Week ${fmtInt(previewIdx + 1)} of ${fmtInt(tl.total)}` : "Outside the grid"}
              </p>
            </>
          ) : (
            "Enter a target to preview."
          )}
        </div>
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className={btnPrimary}>{editing ? "Save changes" : "Add milestone"}</button>
          {editing && <button type="button" className={btn} onClick={reset}>Cancel</button>}
        </div>
      </form>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <h3 className="mb-2 text-sm font-semibold">Pinned <span className="num font-normal text-slate-500">({milestones.length})</span></h3>
        {milestones.length === 0 && <p className="text-sm text-slate-500">No milestones yet. Pin a date that matters to see it on the grid.</p>}
        <ul className="divide-y divide-slate-200">
          {[...milestones].sort((x, y) => x.date.localeCompare(y.date)).map((m) => {
            const st = milestoneStatus(tl, m, passed);
            return (
              <li key={m.id} className={`py-3 ${m.visible ? "" : "opacity-60"}`}>
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rotate-45 border-[1.5px] border-slate-900 ${st.reached ? "bg-slate-900" : "bg-white"}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.title}</p>
                    <p className="num text-xs text-slate-500">
                      {formatDate(m.date)} · {st.reached ? "Reached" : "Ahead"}
                      {st.onGrid ? ` · Wk ${fmtInt(st.idx + 1)}` : " · Outside grid"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 pl-5">
                  <button type="button" className={btn + " !px-2 !py-1 !text-xs"} disabled={!st.onGrid} onClick={() => onLocate(st.idx)}>
                    <Crosshair size={13} aria-hidden /> Locate on Grid
                  </button>
                  <button type="button" className={btnIcon} aria-pressed={m.visible} aria-label={m.visible ? `Hide ${m.title}` : `Show ${m.title}`} onClick={() => onUpdate(m.id, { visible: !m.visible })}>
                    {m.visible ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
                  </button>
                  <button
                    type="button"
                    className={btnIcon}
                    aria-label={`Edit ${m.title}`}
                    onClick={() => {
                      setEditing(m.id);
                      setTitle(m.title);
                      setKind("date");
                      setDate(m.date);
                      setError("");
                    }}
                  >
                    <Pencil size={15} aria-hidden />
                  </button>
                  {confirmDel === m.id ? (
                    <span className="ml-1 inline-flex items-center gap-2 text-xs text-rose-900">
                      Delete?
                      <button type="button" className="font-semibold underline" onClick={() => { onDelete(m.id); setConfirmDel(null); }}>Confirm</button>
                      <button type="button" className="underline" onClick={() => setConfirmDel(null)}>Cancel</button>
                    </span>
                  ) : (
                    <button type="button" className={btnIcon} aria-label={`Delete ${m.title}`} onClick={() => setConfirmDel(m.id)}>
                      <Trash2 size={15} aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={12} aria-hidden /> Milestones show as diamonds on the grid and the progress bar.</p>
    </div>
  );
}
