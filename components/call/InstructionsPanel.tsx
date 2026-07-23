import type { SessionConfig } from "@/lib/types";

// Static scenario brief for the rep — what they are meant to practise.
// Driven by the SessionConfig the call was started with (Phase 2 setup).
export function InstructionsPanel({ config }: { config: SessionConfig }) {
  const { persona, scenario } = config;
  const ROWS: [string, string, boolean][] = [
    ["Who you're calling", `${persona.role}, ${persona.industry}`, false],
    ["Their mood", persona.behaviour, false],
    ["Resistance", persona.resistance, true],
    ["Call stage", scenario.salesStage, true],
    ["Your goal", scenario.repGoal, false],
  ];
  return (
    <aside className="w-full rounded-2xl glass p-5 text-sm lg:max-w-xs">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        Your brief
      </h2>

      <dl className="space-y-3.5">
        {ROWS.map(([dt, dd, cap]) => (
          <div key={dt}>
            <dt className="text-[12px] text-muted">{dt}</dt>
            <dd className={`text-[14px] leading-[21px] text-[#D7DAE3] ${cap ? "capitalize" : ""}`}>{dd}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 border-t border-line pt-4 text-[12px] leading-[19px] text-muted">
        Speak naturally. You can talk over the buyer to interrupt — just like a
        real call.
      </p>
    </aside>
  );
}
