"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import { toPersisted, useLedgerState } from "@/hooks/useLedgerState";
import { buildRows, buildTimeline, computeEventIndex, computeMilestoneIndex } from "@/lib/timeline";
import { EventManager } from "./EventManager";
import { LedgerSidebar } from "./LedgerSidebar";
import type { SidebarTab } from "./LedgerSidebar";
import { LedgerStats } from "./LedgerStats";
import { MilestoneManager } from "./MilestoneManager";
import { PhilosophyFooter } from "./PhilosophyFooter";
import { ProgressTracker } from "./ProgressTracker";
import { TimelineControls } from "./TimelineControls";
import { TopBar } from "./TopBar";
import { WeekGrid } from "./WeekGrid";

const LedgerAnalytics = dynamic(() => import("./LedgerAnalytics"), {
  ssr: false,
  loading: () => <div className="h-72 rounded-lg border border-slate-200 bg-white" aria-hidden />,
});

function Skeleton() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="Loading your ledger">
      <div className="h-14 border-b border-slate-200 bg-white" />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6">
        <div className="h-44 rounded-lg border border-slate-200 bg-white" />
        <div className="h-20 rounded-lg border border-slate-200 bg-white" />
        <div className="h-96 rounded-lg border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

export function LedgerApp() {
  const { state, actions } = useLedgerState();
  if (!state.hydrated) return <Skeleton />;
  return <Ledger state={state} actions={actions} />;
}

function Ledger({ state, actions }: { state: ReturnType<typeof useLedgerState>["state"]; actions: ReturnType<typeof useLedgerState>["actions"] }) {
  const { config, passedWeeks, events, milestones, today } = state;
  const [tab, setTab] = useState<SidebarTab>("events");
  const [focusSignal, setFocusSignal] = useState(0);
  const [focusEventId, setFocusEventId] = useState<string | null>(null);
  const [flashRow, setFlashRow] = useState(-1);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tl = useMemo(() => buildTimeline(config, today), [config, today]);
  const evIdx = useMemo(() => computeEventIndex(tl, events), [tl, events]);
  const msIdx = useMemo(() => computeMilestoneIndex(tl, milestones), [tl, milestones]);
  const { rows, passedCount } = useMemo(
    () => buildRows(tl, passedWeeks, evIdx, msIdx, events, { highlight: config.highlight, focusEventId }),
    [tl, passedWeeks, evIdx, msIdx, events, config.highlight, focusEventId],
  );
  const hasEvents = events.some((e) => e.visible);

  const addEvent = useCallback(() => {
    setTab("events");
    setFocusSignal((n) => n + 1);
  }, []);

  const openMilestones = useCallback(() => {
    setTab("milestones");
    document.getElementById("events")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);

  const locate = useCallback((idx: number) => {
    const row = Math.floor(idx / 52);
    const el = document.querySelector<HTMLElement>(`[data-week="${idx}"]`);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    el?.classList.remove("cell-flash");
    void el?.offsetWidth;
    el?.classList.add("cell-flash");
    setFlashRow(row);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => {
      setFlashRow(-1);
      el?.classList.remove("cell-flash");
    }, 1900);
  }, []);

  return (
    <div className="min-h-screen">
      <TopBar onAddEvent={addEvent} />
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6">
        <ProgressTracker
          tl={tl}
          passed={passedCount}
          mapped={evIdx.mapped}
          milestones={milestones}
          events={events}
          passedWeeks={passedWeeks}
          onPinMilestone={openMilestones}
        />
        <LedgerStats tl={tl} passed={passedCount} mapped={evIdx.mapped} hasEvents={hasEvents} />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,68fr)_minmax(0,32fr)]">
          <div className="min-w-0 space-y-4">
            <TimelineControls
              config={config}
              tl={tl}
              getPersisted={() => toPersisted(state)}
              onMode={actions.setMode}
              onAnchor={actions.setAnchor}
              onSync={actions.syncElapsed}
              onClear={actions.clearPassed}
              onImport={actions.importData}
            />
            <WeekGrid
              tl={tl}
              rows={rows}
              config={config}
              passed={passedWeeks}
              events={events}
              evIdx={evIdx}
              msIdx={msIdx}
              flashRow={flashRow}
              setWeeks={actions.setWeeks}
              setConfig={actions.setConfig}
            />
          </div>
          <LedgerSidebar tab={tab} onTab={setTab}>
            {tab === "events" ? (
              <EventManager
                tl={tl}
                events={events}
                evIdx={evIdx}
                passed={passedWeeks}
                focusSignal={focusSignal}
                focusEventId={focusEventId}
                onFocusEvent={setFocusEventId}
                onAdd={actions.addEvent}
                onUpdate={actions.updateEvent}
                onDelete={actions.deleteEvent}
              />
            ) : (
              <MilestoneManager
                tl={tl}
                milestones={milestones}
                passed={passedWeeks}
                onAdd={actions.addMilestone}
                onUpdate={actions.updateMilestone}
                onDelete={actions.deleteMilestone}
                onLocate={locate}
              />
            )}
          </LedgerSidebar>
        </div>

        <LedgerAnalytics tl={tl} evIdx={evIdx} milestones={milestones} hasEvents={hasEvents} onAddEvent={addEvent} />
        <PhilosophyFooter />
      </main>
    </div>
  );
}
