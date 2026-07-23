"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { NavShell } from "@/components/nav/NavShell";

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-300 ease-spring ${on ? "border-primary/50 bg-primary/60" : "border-line bg-white/[0.06]"}`}
    >
      <span className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white transition-all duration-300 ease-spring ${on ? "left-[26px]" : "left-[3px]"}`} />
    </button>
  );
}

const VOICES = ["Cedar", "Marin", "Ash", "Verse"];

export default function Settings() {
  const [name, setName] = useState("William Kiong");
  const [voice, setVoice] = useState("Cedar");
  const [emailDigest, setEmailDigest] = useState(true);
  const [autoScore, setAutoScore] = useState(true);

  const inputCls =
    "rounded-[14px] border border-line bg-[rgba(10,11,16,0.5)] px-[18px] py-3.5 text-[15px] text-[#D7DAE3] outline-none transition-colors duration-300 focus:border-primary/60";

  return (
    <NavShell>
      <Reveal as="header" className="flex flex-col gap-1.5">
        <span className="w-max rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93C5FD]">Settings</span>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">Preferences</h1>
        <p className="text-[14px] text-muted sm:text-[15px]">Defaults for how your sessions run.</p>
      </Reveal>

      <div className="flex w-full max-w-[720px] flex-col gap-6">
        {/* Profile */}
        <Reveal className="bezel">
          <div className="bezel-inner flex flex-col gap-5 px-6 py-7 sm:px-8">
            <span className="text-[15px] font-semibold text-ink">Profile</span>
            <div className="flex flex-col gap-[11px]">
              <label htmlFor="name" className="text-[14px] font-medium text-muted">Display name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </div>
          </div>
        </Reveal>

        {/* Practice defaults */}
        <Reveal delay={80} className="bezel">
          <div className="bezel-inner flex flex-col gap-5 px-6 py-7 sm:px-8">
            <span className="text-[15px] font-semibold text-ink">Practice defaults</span>
            <div className="flex flex-col gap-[11px]">
              <span className="text-[14px] font-medium text-muted">Default buyer voice</span>
              <div className="flex flex-wrap gap-2.5">
                {VOICES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVoice(v)}
                    aria-pressed={voice === v}
                    className={`cursor-pointer rounded-full border px-4 py-[9px] text-[14px] font-medium transition-all duration-300 ease-spring active:scale-[0.96] ${
                      voice === v ? "border-primary/50 bg-primary/[0.16] text-[#DBEAFE]" : "border-line text-[#B4B9C6] hover:border-white/25 hover:text-ink"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-medium text-ink">Auto-score after each call</span>
                <span className="text-[13px] text-muted">Run the evaluation as soon as a call ends.</span>
              </div>
              <Toggle on={autoScore} onToggle={() => setAutoScore((v) => !v)} label="Auto-score after each call" />
            </div>
          </div>
        </Reveal>

        {/* Notifications */}
        <Reveal delay={160} className="bezel">
          <div className="bezel-inner flex items-center justify-between px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-medium text-ink">Weekly progress email</span>
              <span className="text-[13px] text-muted">A digest of your scores and focus areas.</span>
            </div>
            <Toggle on={emailDigest} onToggle={() => setEmailDigest((v) => !v)} label="Weekly progress email" />
          </div>
        </Reveal>

        {/* Account actions */}
        <Reveal delay={240} className="flex flex-col gap-3 rounded-[18px] border border-line bg-[rgba(20,22,29,0.5)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-medium text-ink">New here?</span>
            <span className="text-[13px] text-muted">Replay the guided walkthrough any time.</span>
          </div>
          <Link href="/onboarding" className="w-max rounded-full border border-line bg-[rgba(20,22,29,0.6)] px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:border-white/25">
            Replay walkthrough
          </Link>
        </Reveal>
      </div>
    </NavShell>
  );
}
