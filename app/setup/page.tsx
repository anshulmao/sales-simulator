"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Blob } from "@/components/ui/Blob";
import { Cta } from "@/components/ui/Cta";
import { Reveal } from "@/components/ui/Reveal";
import type { SessionConfig } from "@/lib/types";
import { saveSessionConfig } from "@/lib/sessionStore";

type Tone = "primary" | "danger";

function ChipField({
  label,
  options,
  value,
  onChange,
  tone = "primary",
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  tone?: Tone;
}) {
  const on =
    tone === "danger"
      ? "border-danger/50 bg-danger/[0.16] text-[#FCA5A5]"
      : "border-primary/50 bg-primary/[0.16] text-[#DBEAFE]";
  return (
    <div className="flex flex-col gap-[11px]">
      <span className="text-[14px] font-semibold text-ink">{label}</span>
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={`cursor-pointer rounded-full border px-4 py-[9px] text-[14px] font-medium transition-all duration-300 ease-spring active:scale-[0.96] ${
              value === o ? on : "border-line text-[#B4B9C6] hover:border-white/25 hover:text-ink"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// Resistance level -> a behaviour description for the AI buyer.
const BEHAVIOUR: Record<string, string> = {
  Low: "open and receptive, willing to explore ideas and share context freely",
  Medium: "professional but guarded — needs convincing before opening up",
  High: "busy and skeptical of vendors; only warms up if you clearly understand their world",
};

export default function Setup() {
  const router = useRouter();
  const [role, setRole] = useState("VP of Operations");
  const [industry, setIndustry] = useState("Logistics");
  const [resistance, setResistance] = useState("High");
  const [stage, setStage] = useState("Discovery");
  const [goal, setGoal] = useState(
    "Uncover their top operational pain and book a follow-up demo"
  );

  const canStart = goal.trim().length > 0;

  function startCall() {
    if (!canStart) return;
    const config: SessionConfig = {
      persona: {
        role,
        industry: industry.toLowerCase(),
        behaviour: BEHAVIOUR[resistance] ?? BEHAVIOUR.Medium,
        resistance: resistance.toLowerCase() as SessionConfig["persona"]["resistance"],
      },
      scenario: { salesStage: stage.toLowerCase(), repGoal: goal.trim() },
      voice: "cedar",
    };
    saveSessionConfig(config);
    router.push("/call");
  }

  return (
    <main className="mesh-bg flex min-h-[100dvh] flex-col items-center gap-8 px-5 py-12 sm:px-10 lg:px-14">
      <Reveal className="flex w-full flex-col items-center gap-2 text-center">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93C5FD]">New session</span>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[32px]">Set up your call</h1>
        <p className="max-w-[520px] text-[14px] text-muted sm:text-[15px]">Shape the buyer and the scenario. This compiles into how the AI behaves.</p>
      </Reveal>

      <div className="flex w-[1180px] max-w-full flex-col items-stretch gap-6 lg:flex-row">
        {/* Form — double-bezel */}
        <Reveal delay={80} className="bezel flex-1">
          <div className="bezel-inner flex flex-col gap-7 px-6 py-8 sm:px-[34px]">
            <ChipField label="Session type" value="One-off call" onChange={() => {}} options={["One-off call", "Pipeline (linked sessions)"]} />
            <ChipField label="Buyer role" value={role} onChange={setRole} options={["VP of Operations", "CFO", "Procurement Lead", "IT Director"]} />
            <ChipField label="Industry" value={industry} onChange={setIndustry} options={["SaaS", "Logistics", "Healthcare", "Manufacturing"]} />
            <ChipField label="Resistance level" value={resistance} onChange={setResistance} tone="danger" options={["Low", "Medium", "High"]} />
            <ChipField label="Sales stage" value={stage} onChange={setStage} options={["Prospecting", "Discovery", "Objection handling", "Closing"]} />
            <div className="flex flex-col gap-[11px]">
              <label htmlFor="goal" className="text-[14px] font-semibold text-ink">Your goal for this call</label>
              <input
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Uncover their top pain and book a follow-up demo"
                className="rounded-[14px] border border-line bg-[rgba(10,11,16,0.5)] px-[18px] py-3.5 text-[15px] text-[#D7DAE3] outline-none transition-colors duration-300 placeholder:text-neutral-600 focus:border-primary/60"
              />
              {!canStart && <span className="text-[13px] text-warning/90">Add a goal so the buyer knows what you&apos;re working toward.</span>}
            </div>
          </div>
        </Reveal>

        {/* Preview — double-bezel */}
        <Reveal delay={160} className="bezel w-full shrink-0 lg:w-[360px]">
          <div
            className="bezel-inner flex flex-col items-center gap-[22px] p-[30px]"
            style={{ backgroundImage: "radial-gradient(60% 45% at 50% 0%, rgba(37,99,235,0.18), transparent 65%)" }}
          >
            <span className="text-[13px] font-semibold tracking-[0.12em] text-muted">YOUR BUYER</span>
            <Blob size={120} glow={70} />
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[19px] font-semibold text-ink">{role}</span>
              <span className="text-center text-[14px] leading-[21px] text-muted">
                {industry} · {(BEHAVIOUR[resistance] ?? "").split(";")[0]}
              </span>
            </div>
            <div className="flex w-full flex-col gap-3 border-t border-line pt-4">
              {[["Stage", stage], ["Resistance", resistance], ["Voice", "Cedar"]].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[14px] text-muted">{k}</span>
                  <span className="text-[14px] font-medium text-ink">{v}</span>
                </div>
              ))}
            </div>
            <Cta
              onClick={startCall}
              disabled={!canStart}
              className="w-full justify-center"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>}
            >
              Start call
            </Cta>
            <Link href="/" className="text-[13px] font-medium text-muted transition-colors hover:text-ink">Cancel</Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
