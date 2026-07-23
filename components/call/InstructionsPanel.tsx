import type { SessionConfig } from "@/lib/types";

// Static scenario brief for the rep — what they are meant to practise.
// Driven by the SessionConfig the call was started with (Phase 2 setup).
export function InstructionsPanel({ config }: { config: SessionConfig }) {
  const { persona, scenario } = config;
  return (
    <aside className="w-full max-w-xs rounded-2xl glass p-5 text-sm">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        Your brief
      </h2>

      <dl className="space-y-3">
        <div>
          <dt className="text-neutral-500">Who you're calling</dt>
          <dd className="text-neutral-200">
            {persona.role}, {persona.industry}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">Their mood</dt>
          <dd className="text-neutral-200">{persona.behaviour}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Resistance</dt>
          <dd className="capitalize text-neutral-200">{persona.resistance}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Call stage</dt>
          <dd className="capitalize text-neutral-200">{scenario.salesStage}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Your goal</dt>
          <dd className="text-neutral-200">{scenario.repGoal}</dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-neutral-800 pt-4 text-xs text-neutral-500">
        Speak naturally. You can talk over the buyer to interrupt — just like a
        real call.
      </p>
    </aside>
  );
}
