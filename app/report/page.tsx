"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadSession, type StoredSession } from "@/lib/sessionStore";

const VOICE = [
  { label: "Clarity", value: 84 },
  { label: "Pace & speed", value: 76 },
  { label: "Tone & pitch", value: 80 },
];
const SCENARIO = [
  { label: "Opening", value: 85, color: "#60A5FA" },
  { label: "Discovery & needs", value: 88, color: "#60A5FA" },
  { label: "Objection handling", value: 71, color: "#F59E0B" },
  { label: "Closing", value: 62, color: "#F59E0B" },
];
const STRENGTHS = [
  ["Opened with a sharp, relevant hook", "You referenced their month-end crunch in the first 30 seconds, which lowered their guard."],
  ["Strong discovery questioning", "Open questions uncovered the real pain — manual reconciliation — instead of pitching early."],
  ["Good listening ratio", "You spoke 43% of the time and let the buyer lead — ideal for a discovery call."],
];
const IMPROVE = [
  ["Closing felt rushed", "You asked for the demo before confirming value. Summarise the pain, then propose next steps."],
  ["Conceded on price too quickly", "When they pushed back on cost, you discounted. Re-anchor on ROI before moving on price."],
  ["Missed a buying signal", "At 6:12 they mentioned budget approval — a clear signal to explore timeline. You moved past it."],
];

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
function fmtDuration(ms: number) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m} min ${s.toString().padStart(2, "0")}s`;
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[14px] text-[#D7DAE3]">{label}</span>
        <span className="text-[14px] font-semibold" style={{ color: value < 75 ? color : "#EDEFF4" }}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.08]">
        <div className="h-2 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const SAMPLE_META = "VP of Operations · Discovery · High resistance · 8 min 04s · Today, 11:20am";

export default function Report() {
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
  useEffect(() => setSession(loadSession()), []);

  if (session === undefined) {
    return (
      <main className="mesh-bg flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Loading report…</p>
      </main>
    );
  }

  const meta = session
    ? `${session.config.persona.role} · ${cap(session.config.scenario.salesStage)} · ${cap(session.config.persona.resistance)} resistance · ${fmtDuration(session.durationMs)} · ${new Date(session.endedAt).toLocaleString([], { hour: "2-digit", minute: "2-digit" })}`
    : SAMPLE_META;

  return (
    <main className="mesh-bg flex min-h-screen flex-col gap-7 px-12 py-9">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-[7px]">
          <Link href="/" className="flex items-center gap-2.5 text-[14px] font-medium text-muted hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Back to home
          </Link>
          <h1 className="text-[30px] font-semibold tracking-tight text-ink">Session report</h1>
          <p className="text-[15px] text-muted">{meta}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/setup" className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-[rgba(20,22,29,0.5)] px-[18px] py-3 text-[14px] font-medium text-ink">Practise again</Link>
          <button className="flex cursor-pointer items-center gap-2 rounded-full px-[18px] py-3 text-[14px] font-semibold text-white" style={{ backgroundImage: "linear-gradient(135deg,#3B82F6,#2563EB)" }}>Share</button>
        </div>
      </header>

      {/* Honest banner: for a real call we have the transcript but not scores yet. */}
      {session && (
        <div className="flex items-center gap-3 rounded-[14px] border border-warning/30 bg-warning/[0.08] px-5 py-3.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <span className="text-[14px]" style={{ color: "#F5D9A6" }}>Scores below are illustrative — live scoring connects once the evaluation model is wired. Your transcript from this call is real and shown at the bottom.</span>
        </div>
      )}

      {/* Score row */}
      <section className="flex items-stretch gap-6">
        <div className="flex w-[400px] shrink-0 flex-col items-center justify-center gap-[22px] rounded-[22px] border border-success/[0.28] p-9" style={{ backgroundColor: "rgba(20,22,29,0.5)", backgroundImage: "radial-gradient(70% 60% at 50% 0%, rgba(34,197,94,0.16), transparent 65%)" }}>
          <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full" style={{ backgroundImage: "conic-gradient(#22C55E 0% 82%, rgba(255,255,255,0.07) 82% 100%)" }}>
            <div className="flex h-[158px] w-[158px] flex-col items-center justify-center rounded-full bg-[#0B0D13]">
              <span className="text-[56px] font-semibold leading-none tracking-[-0.03em] text-ink">82</span>
              <span className="mt-1 text-[13px] font-medium tracking-[0.06em] text-muted">OUT OF 100</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[20px] font-semibold text-ink">Strong discovery call</span>
            <span className="text-center text-[14px] leading-[21px] text-muted">You built rapport fast and surfaced a real pain. Closing was rushed.</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 rounded-[22px] border border-line bg-[rgba(20,22,29,0.5)] px-[34px] py-[30px]">
          <span className="text-[17px] font-semibold text-ink">Score breakdown</span>
          <div className="flex gap-10">
            <div className="flex flex-1 flex-col gap-[18px]">
              <span className="text-[13px] font-semibold tracking-[0.1em] text-[#22D3EE]">VOICE</span>
              <div className="flex flex-col gap-4">{VOICE.map((m) => <Meter key={m.label} label={m.label} value={m.value} color="#22D3EE" />)}</div>
            </div>
            <div className="flex flex-1 flex-col gap-[18px]">
              <span className="text-[13px] font-semibold tracking-[0.1em] text-[#93C5FD]">SCENARIO</span>
              <div className="flex flex-col gap-4">{SCENARIO.map((m) => <Meter key={m.label} label={m.label} value={m.value} color={m.color} />)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="flex items-stretch gap-6">
        <div className="flex flex-1 basis-0 flex-col gap-5 rounded-[22px] border border-line bg-[rgba(20,22,29,0.5)] px-[30px] py-7">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-success/[0.16]"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></div>
            <span className="text-[17px] font-semibold text-ink">What worked</span>
          </div>
          {STRENGTHS.map(([t, d]) => (<div key={t} className="flex flex-col gap-1"><span className="text-[15px] font-semibold text-ink">{t}</span><span className="text-[14px] leading-[21px] text-muted">{d}</span></div>))}
        </div>
        <div className="flex flex-1 basis-0 flex-col gap-5 rounded-[22px] border border-line bg-[rgba(20,22,29,0.5)] px-[30px] py-7">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-warning/[0.16]"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg></div>
            <span className="text-[17px] font-semibold text-ink">Areas to work on</span>
          </div>
          {IMPROVE.map(([t, d]) => (<div key={t} className="flex flex-col gap-1"><span className="text-[15px] font-semibold text-ink">{t}</span><span className="text-[14px] leading-[21px] text-muted">{d}</span></div>))}
        </div>
      </section>

      {/* Real transcript (only when we came from an actual call) */}
      {session && (
        <section className="flex flex-col gap-4 rounded-[22px] border border-line bg-[rgba(20,22,29,0.5)] px-[34px] py-7">
          <span className="text-[17px] font-semibold text-ink">Full transcript</span>
          {session.transcript.length === 0 ? (
            <p className="text-[14px] text-muted">No transcript was captured for this call.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {session.transcript.map((e) => (
                <div key={e.id} className="flex flex-col gap-1">
                  <span className={`text-[13px] font-semibold ${e.role === "user" ? "text-[#22D3EE]" : "text-[#60A5FA]"}`}>{e.role === "user" ? "You" : "Buyer"}</span>
                  <p className="text-[15px] leading-[23px] text-[#D7DAE3]">{e.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Next practice */}
      <section className="flex items-center justify-between rounded-[22px] border border-violet/30 px-[30px] py-6" style={{ backgroundColor: "rgba(20,22,29,0.5)", backgroundImage: "radial-gradient(50% 140% at 90% 50%, rgba(124,92,255,0.22), transparent 60%)" }}>
        <div className="flex items-center gap-[18px]">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px]" style={{ backgroundImage: "linear-gradient(135deg,#7C5CFF,#4C1D95)" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z" /></svg></div>
          <div className="flex flex-col gap-1"><span className="text-[13px] font-semibold tracking-[0.1em] text-[#B9A6FF]">RECOMMENDED NEXT</span><span className="text-[18px] font-semibold text-ink">Practise objection handling with a price-sensitive CFO</span></div>
        </div>
        <Link href="/setup" className="flex items-center gap-2 rounded-full px-[22px] py-[13px] text-[15px] font-semibold text-white" style={{ backgroundImage: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
          Start drill
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
        </Link>
      </section>
    </main>
  );
}
