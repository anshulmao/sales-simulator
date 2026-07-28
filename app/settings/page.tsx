"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { NavShell } from "@/components/nav/NavShell";
import { useSettings } from "@/hooks/useSettings";
import { VOICE_OPTIONS } from "@/lib/voices";

export default function Settings() {
  // Persisted immediately on change (localStorage via lib/sessionStore) —
  // no save button. Setup seeds its voice chip from defaultVoiceLabel, and
  // NavShell / Home render displayName.
  const { settings, update } = useSettings();

  const inputCls =
    "rounded-[14px] border border-line bg-[rgba(10,11,16,0.5)] px-[18px] py-3.5 text-[15px] text-[#D7DAE3] outline-none transition-colors duration-300 focus:border-primary/60";

  return (
    <NavShell>
      <Reveal as="header" className="flex flex-col gap-1.5">
        <span className="w-max rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93C5FD]">Settings</span>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">Preferences</h1>
        <p className="text-[14px] text-muted sm:text-[15px]">Defaults for how your sessions run. Changes save automatically.</p>
      </Reveal>

      <div className="flex w-full max-w-[720px] flex-col gap-6">
        {/* Profile */}
        <Reveal className="bezel">
          <div className="bezel-inner flex flex-col gap-5 px-6 py-7 sm:px-8">
            <span className="text-[15px] font-semibold text-ink">Profile</span>
            <div className="flex flex-col gap-[11px]">
              <label htmlFor="name" className="text-[14px] font-medium text-muted">Display name</label>
              <input
                id="name"
                value={settings.displayName}
                onChange={(e) => update({ displayName: e.target.value })}
                className={inputCls}
              />
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
                {Object.keys(VOICE_OPTIONS).map((v) => (
                  <button
                    key={v}
                    onClick={() => update({ defaultVoiceLabel: v })}
                    aria-pressed={settings.defaultVoiceLabel === v}
                    className={`cursor-pointer rounded-full border px-4 py-[9px] text-[14px] font-medium transition-all duration-300 ease-spring active:scale-[0.96] ${
                      settings.defaultVoiceLabel === v ? "border-primary/50 bg-primary/[0.16] text-[#DBEAFE]" : "border-line text-[#B4B9C6] hover:border-white/25 hover:text-ink"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-[13px] text-muted">Pre-selected when you set up a new call; you can still change it per session.</p>
            </div>
          </div>
        </Reveal>

        {/* Account actions */}
        <Reveal delay={160} className="flex flex-col gap-3 rounded-[18px] border border-line bg-[rgba(20,22,29,0.5)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
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
