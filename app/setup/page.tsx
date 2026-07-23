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

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  optional,
  multiline,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
}) {
  const cls =
    "rounded-[14px] border border-line bg-[rgba(10,11,16,0.5)] px-[18px] py-3.5 text-[15px] text-[#D7DAE3] outline-none transition-colors duration-300 placeholder:text-neutral-600 focus:border-primary/60";
  return (
    <div className="flex flex-col gap-[11px]">
      <label htmlFor={id} className="text-[14px] font-semibold text-ink">
        {label}
        {optional && <span className="ml-2 text-[12px] font-normal text-muted">optional</span>}
      </label>
      {multiline ? (
        <textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${cls} resize-none`} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

// Behaviour is an independent persona axis (not derived from resistance): each
// trait maps to a temperament sentence that lands directly in the AI buyer's
// system prompt via persona.behaviour.
const BEHAVIOUR: Record<string, string> = {
  Friendly: "warm and personable, happy to chat — but you still need real substance before committing",
  Skeptical: "distrustful of vendors; you probe claims and push back on anything vague",
  Analytical: "detail-driven; you want data, specifics, and a clear ROI before you engage",
  Distracted: "busy and multitasking; the rep has to earn and hold your attention",
};

// Friendly display label -> the OpenAI Realtime voice id set on the session.
// cedar and marin are the recommended-quality voices.
const VOICES: Record<string, string> = {
  Cedar: "cedar",
  Marin: "marin",
  Ash: "ash",
  Verse: "verse",
};

const ENVIRONMENTS = ["Cold call", "Booked demo", "Inbound enquiry", "Trade show"];
const EXPERIENCE = ["New to sales", "1–3 years", "Experienced", "Senior"];

export default function Setup() {
  const router = useRouter();
  // Core persona + scenario
  const [sessionType, setSessionType] = useState("One-off call");
  const [role, setRole] = useState("VP of Operations");
  const [behaviour, setBehaviour] = useState("Skeptical");
  const [industry, setIndustry] = useState("Logistics");
  const [resistance, setResistance] = useState("High");
  const [stage, setStage] = useState("Discovery");
  const [environment, setEnvironment] = useState("Cold call");
  const [voiceLabel, setVoiceLabel] = useState("Cedar");
  const [goal, setGoal] = useState(
    "Uncover their top operational pain and book a follow-up demo"
  );
  // Optional context — enriches the buyer / scorer when provided
  const [salesExperience, setSalesExperience] = useState("");
  const [product, setProduct] = useState("");
  const [brand, setBrand] = useState("");
  const [positioning, setPositioning] = useState("");
  const [playbook, setPlaybook] = useState("");
  const [history, setHistory] = useState("");

  const canStart = goal.trim().length > 0;

  function startCall() {
    if (!canStart) return;

    // Only include optional context that was actually filled in — keeps the
    // config clean and lets buildInstructions guard on presence.
    const company = {
      ...(product.trim() ? { product: product.trim() } : {}),
      ...(brand.trim() ? { brand: brand.trim() } : {}),
      ...(positioning.trim() ? { marketPositioning: positioning.trim() } : {}),
      ...(playbook.trim() ? { salesPlaybook: playbook.trim() } : {}),
    };

    const config: SessionConfig = {
      persona: {
        role,
        industry: industry.toLowerCase(),
        behaviour: BEHAVIOUR[behaviour] ?? BEHAVIOUR.Skeptical,
        resistance: resistance.toLowerCase() as SessionConfig["persona"]["resistance"],
        ...(history.trim() ? { engagementHistory: history.trim() } : {}),
      },
      scenario: {
        salesStage: stage.toLowerCase(),
        repGoal: goal.trim(),
        environment: environment.toLowerCase(),
      },
      ...(salesExperience ? { seller: { salesExperience } } : {}),
      ...(Object.keys(company).length ? { company } : {}),
      sessionType: sessionType.startsWith("Pipeline") ? "pipeline" : "one-off",
      voice: VOICES[voiceLabel] ?? "cedar",
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

      <div className="flex w-[1180px] max-w-full flex-col items-start gap-6 lg:flex-row">
        {/* Form — double-bezel */}
        <Reveal delay={80} className="bezel flex-1">
          <div className="bezel-inner flex flex-col gap-7 px-6 py-8 sm:px-[34px]">
            <ChipField label="Session type" value={sessionType} onChange={setSessionType} options={["One-off call", "Pipeline (linked sessions)"]} />
            <ChipField label="Buyer role" value={role} onChange={setRole} options={["VP of Operations", "CFO", "Procurement Lead", "IT Director"]} />
            <ChipField label="Behaviour" value={behaviour} onChange={setBehaviour} options={Object.keys(BEHAVIOUR)} />
            <ChipField label="Industry" value={industry} onChange={setIndustry} options={["SaaS", "Logistics", "Healthcare", "Manufacturing"]} />
            <ChipField label="Resistance level" value={resistance} onChange={setResistance} tone="danger" options={["Low", "Medium", "High"]} />
            <ChipField label="Sales stage" value={stage} onChange={setStage} options={["Prospecting", "Discovery", "Objection handling", "Closing"]} />
            <ChipField label="Environment" value={environment} onChange={setEnvironment} options={ENVIRONMENTS} />
            <ChipField label="Buyer voice" value={voiceLabel} onChange={setVoiceLabel} options={Object.keys(VOICES)} />
            <TextField id="goal" label="Your goal for this call" value={goal} onChange={setGoal} placeholder="e.g. Uncover their top pain and book a follow-up demo" />
            {!canStart && <span className="-mt-4 text-[13px] text-warning/90">Add a goal so the buyer knows what you&apos;re working toward.</span>}

            {/* Optional context — sharpens realism, feeds persona + scoring */}
            <div className="flex flex-col gap-1.5 border-t border-line pt-7">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93C5FD]">Context</span>
              <p className="text-[13px] leading-[19px] text-muted">Optional — the more you add, the more realistically the buyer pushes back, and the sharper your scoring.</p>
            </div>
            <ChipField label="Your sales experience" value={salesExperience} onChange={setSalesExperience} options={EXPERIENCE} />
            <TextField id="product" label="What you sell" value={product} onChange={setProduct} optional placeholder="e.g. A logistics visibility platform for mid-market shippers" />
            <TextField id="brand" label="Brand" value={brand} onChange={setBrand} optional placeholder="e.g. Freightly" />
            <TextField id="positioning" label="Market positioning" value={positioning} onChange={setPositioning} optional placeholder="e.g. The affordable alternative to enterprise TMS suites" />
            <TextField id="playbook" label="Sales playbook" value={playbook} onChange={setPlaybook} optional multiline placeholder="Key talk tracks, discovery questions, or objection responses you want to practise" />
            <TextField id="history" label="Prior engagement" value={history} onChange={setHistory} optional multiline placeholder="e.g. Met at a conference last month; they asked about pricing but went quiet" />
          </div>
        </Reveal>

        {/* Preview — double-bezel */}
        <Reveal delay={160} className="bezel w-full shrink-0 lg:sticky lg:top-6 lg:w-[360px]">
          <div
            className="bezel-inner flex flex-col items-center gap-[22px] p-[30px]"
            style={{ backgroundImage: "radial-gradient(60% 45% at 50% 0%, rgba(37,99,235,0.18), transparent 65%)" }}
          >
            <span className="text-[13px] font-semibold tracking-[0.12em] text-muted">YOUR BUYER</span>
            <Blob size={120} glow={70} />
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[19px] font-semibold text-ink">{role}</span>
              <span className="text-center text-[14px] leading-[21px] text-muted">
                {industry} · {(BEHAVIOUR[behaviour] ?? "").split(/[;,]/)[0]}
              </span>
            </div>
            <div className="flex w-full flex-col gap-3 border-t border-line pt-4">
              {[["Stage", stage], ["Environment", environment], ["Resistance", resistance], ["Behaviour", behaviour], ["Voice", voiceLabel]].map(([k, v]) => (
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
