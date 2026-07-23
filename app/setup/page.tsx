"use client";

import { useState } from "react";
import Link from "next/link";
import { Blob } from "@/components/ui/Blob";

type Tone = "primary" | "danger";

function ChipField({
  label,
  options,
  initial,
  tone = "primary",
}: {
  label: string;
  options: string[];
  initial: string;
  tone?: Tone;
}) {
  const [selected, setSelected] = useState(initial);
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
            onClick={() => setSelected(o)}
            className={`cursor-pointer rounded-full border px-4 py-[9px] text-[14px] font-medium transition-colors ${
              selected === o ? on : "border-line text-[#B4B9C6] hover:border-white/25"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Setup() {
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
          <ChipField label="Session type" initial="One-off call" options={["One-off call", "Pipeline (linked sessions)"]} />
          <ChipField label="Buyer role" initial="VP of Operations" options={["VP of Operations", "CFO", "Procurement Lead", "IT Director"]} />
          <ChipField label="Industry" initial="Logistics" options={["SaaS", "Logistics", "Healthcare", "Manufacturing"]} />
          <ChipField label="Resistance level" initial="High" tone="danger" options={["Low", "Medium", "High"]} />
          <ChipField label="Sales stage" initial="Discovery" options={["Prospecting", "Discovery", "Objection handling", "Closing"]} />
          <div className="flex flex-col gap-[11px]">
            <span className="text-[14px] font-semibold text-ink">Your goal for this call</span>
            <div className="rounded-[14px] border border-line bg-[rgba(10,11,16,0.5)] px-[18px] py-3.5 text-[15px] text-[#D7DAE3]">
              Uncover their top operational pain and book a follow-up demo
            </div>
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
            <span className="text-[19px] font-semibold text-ink">VP of Operations</span>
            <span className="text-center text-[14px] leading-[21px] text-muted">Mid-market logistics · busy, skeptical, high resistance</span>
          </div>
          <div className="flex w-full flex-col gap-3 border-t border-line pt-1.5">
            {[["Stage", "Discovery"], ["Voice", "Cedar"], ["Est. length", "8–10 min"]].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[14px] text-muted">{k}</span>
                <span className="text-[14px] font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>
          <Link
            href="/call"
            className="flex w-full items-center justify-center gap-2.5 rounded-[14px] py-4 text-[16px] font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{ backgroundImage: "linear-gradient(135deg,#3B82F6,#2563EB)", boxShadow: "0 8px 30px rgba(37,99,235,0.45)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
            Start call
          </Link>
        </div>
      </div>
    </main>
  );
}
