"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Blob } from "@/components/ui/Blob";
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
            className={`cursor-pointer rounded-full border px-4 py-[9px] text-[14px] font-medium transition-colors ${
              value === o ? on : "border-line text-[#B4B9C6] hover:border-white/25"
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

  function startCall() {
    const config: SessionConfig = {
      persona: {
        role,
        industry: industry.toLowerCase(),
        behaviour: BEHAVIOUR[resistance] ?? BEHAVIOUR.Medium,
        resistance: resistance.toLowerCase() as SessionConfig["persona"]["resistance"],
      },
      scenario: { salesStage: stage.toLowerCase(), repGoal: goal },
      voice: "cedar",
    };
    saveSessionConfig(config);
    router.push("/call");
  }

  return (
    <main className="mesh-bg flex min-h-screen flex-col items-center gap-8 px-14 py-10">
      <div className="flex w-full flex-col items-center gap-2">
        <span className="text-[13px] font-semibold tracking-[0.12em] text-[#93C5FD]">NEW SESSION</span>
        <h1 className="text-[32px] font-semibold tracking-tight text-ink">Set up your call</h1>
        <p className="text-[15px] text-muted">Shape the buyer and the scenario. This compiles into how the AI behaves.</p>
      </div>

      <div className="flex w-[1180px] max-w-full items-stretch gap-6">
        {/* Form */}
        <div className="flex flex-1 flex-col gap-7 rounded-[22px] border border-line bg-[rgba(20,22,29,0.5)] px-[34px] py-8">
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
              className="rounded-[14px] border border-line bg-[rgba(10,11,16,0.5)] px-[18px] py-3.5 text-[15px] text-[#D7DAE3] outline-none focus:border-primary/60"
            />
          </div>
        </div>

        {/* Preview */}
        <div
          className="flex w-[360px] shrink-0 flex-col items-center gap-[22px] rounded-[22px] border border-primary/30 p-[30px]"
          style={{
            backgroundColor: "rgba(20,22,29,0.5)",
            backgroundImage: "radial-gradient(60% 45% at 50% 0%, rgba(37,99,235,0.18), transparent 65%)",
          }}
        >
          <span className="text-[13px] font-semibold tracking-[0.12em] text-muted">YOUR BUYER</span>
          <Blob size={120} glow={70} />
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[19px] font-semibold text-ink">{role}</span>
            <span className="text-center text-[14px] leading-[21px] text-muted">
              {industry} · {(BEHAVIOUR[resistance] ?? "").split(";")[0]}
            </span>
          </div>
          <div className="flex w-full flex-col gap-3 border-t border-line pt-1.5">
            {[["Stage", stage], ["Resistance", resistance], ["Voice", "Cedar"]].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[14px] text-muted">{k}</span>
                <span className="text-[14px] font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>
          <button
            onClick={startCall}
            className="flex w-full items-center justify-center gap-2.5 rounded-[14px] py-4 text-[16px] font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ backgroundImage: "linear-gradient(135deg,#3B82F6,#2563EB)", boxShadow: "0 8px 30px rgba(37,99,235,0.45)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
            Start call
          </button>
          <Link href="/" className="text-[13px] font-medium text-muted hover:text-ink">Cancel</Link>
        </div>
      </div>
    </main>
  );
}
