import { Panel } from "./ui/Panel";

export function PhilosophyFooter() {
  return (
    <Panel id="philosophy" title="Why four thousand?" eyebrow="Philosophy" className="p-0">
      <div className="grid gap-6 px-4 py-5 sm:px-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            Oliver Burkeman&apos;s <em>Four Thousand Weeks</em> starts from a plain piece of arithmetic: a long life is about four thousand weeks. Seeing the count laid out does not make it smaller, but it does make it real.
          </p>
          <p>
            The point is not to optimise every week. It is to stop pretending the supply is endless, to choose a few things worth the weeks they cost, and to accept the rest as the price of being finite. Each cell is one of those weeks.
          </p>
        </div>
        <div className="border-t border-slate-200 pt-4 text-sm text-slate-600 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <p className="font-semibold text-slate-900">Your data stays here</p>
          <p className="mt-1">Everything is stored only in this browser. Nothing is sent to a server. Use Export to keep a backup or move to another device.</p>
        </div>
      </div>
    </Panel>
  );
}
