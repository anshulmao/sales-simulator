"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Cta } from "@/components/ui/Cta";
import { Reveal } from "@/components/ui/Reveal";
import { NavShell } from "@/components/nav/NavShell";
import { SessionRow } from "@/components/session/SessionRow";
import { useSessions } from "@/hooks/useSessions";
import { useSettings } from "@/hooks/useSettings";

export default function Home() {
  const { sessions, loading } = useSessions();
  const { settings } = useSettings();

  // Time-of-day is clock-dependent, so compute it after mount to keep the
  // server and first client render identical.
  const [dayPart, setDayPart] = useState("afternoon");
  useEffect(() => {
    const h = new Date().getHours();
    setDayPart(h < 12 ? "morning" : h < 18 ? "afternoon" : "evening");
  }, []);
  const firstName = settings.displayName.trim().split(/\s+/)[0] || "there";

  // Real dashboard figures derived from stored sessions — no hardcoded metrics.
  const stats = useMemo(() => {
    const list = sessions ?? [];
    const scored = list.filter((s) => s.overallScore != null).map((s) => s.overallScore as number);
    return {
      count: list.length,
      avg: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
      best: scored.length ? Math.max(...scored) : null,
    };
  }, [sessions]);

  const recent = (sessions ?? []).slice(0, 4);

  const TILES = [
    { label: "Sessions run", value: stats.count.toString(), note: "across all practice", noteColor: "#8A90A0" },
    { label: "Avg. overall score", value: stats.avg?.toString() ?? "—", note: stats.avg == null ? "no scored calls yet" : "keep it climbing", noteColor: "#22C55E" },
    { label: "Best score", value: stats.best?.toString() ?? "—", note: stats.best == null ? "—" : "your personal best", noteColor: "#22C55E" },
  ];

  return (
    <NavShell>
      <Reveal as="header" className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">Good {dayPart}, {firstName}</h1>
          <p className="text-[14px] text-muted sm:text-[15px]">
            {loading ? "Loading your practice…" : stats.count === 0 ? "No sessions yet — run your first roleplay." : `You've run ${stats.count} ${stats.count === 1 ? "call" : "calls"} so far.`}
          </p>
        </div>
      </Reveal>

      {/* Hero CTA — double-bezel tray */}
      <Reveal as="section" delay={80} className="bezel">
        <div
          className="flex flex-col items-start justify-between gap-8 overflow-hidden rounded-[22px] p-7 sm:p-8 md:flex-row md:items-center"
          style={{
            backgroundImage:
              "radial-gradient(60% 120% at 88% 20%, rgba(37,99,235,0.35), transparent 60%), radial-gradient(50% 120% at 100% 100%, rgba(124,92,255,0.25), transparent 60%)",
          }}
        >
          <div className="flex max-w-[560px] flex-col gap-4">
            <span className="w-max rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93C5FD]">Ready to practise</span>
            <h2 className="text-[24px] font-semibold leading-[1.2] tracking-tight text-ink sm:text-[28px] sm:leading-[34px]">
              Run a live roleplay with an AI buyer and get scored in real time.
            </h2>
            <Cta
              href="/setup"
              className="mt-1"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>}
            >
              Start new session
            </Cta>
          </div>
          <div
            className="h-[130px] w-[130px] shrink-0 animate-blob-morph sm:h-[150px] sm:w-[150px]"
            style={{
              borderRadius: "47% 53% 55% 45% / 52% 46% 54% 48%",
              backgroundImage:
                "radial-gradient(42% 40% at 34% 28%, #DBEAFE 0%, rgba(219,234,254,0) 62%), radial-gradient(90% 90% at 50% 52%, #2563EB 0%, #1E3A8A 100%)",
              boxShadow: "0 0 90px 12px rgba(37,99,235,0.55)",
            }}
          />
        </div>
      </Reveal>

      {/* Stat tiles */}
      <section className="flex flex-col gap-5 sm:flex-row">
        {TILES.map((s, i) => (
          <Reveal
            key={s.label}
            delay={140 + i * 70}
            className="flex flex-1 flex-col gap-2.5 rounded-[18px] border border-line bg-[rgba(20,22,29,0.5)] p-[22px] transition-colors duration-300 ease-spring hover:border-white/15"
          >
            <span className="text-[13px] font-medium text-muted">{s.label}</span>
            <span className="text-[32px] font-semibold tracking-tight text-ink sm:text-[34px]">{s.value}</span>
            <span className="text-[13px] font-medium" style={{ color: s.noteColor }}>{s.note}</span>
          </Reveal>
        ))}
      </section>

      {/* Recent sessions */}
      <section className="flex flex-col gap-4">
        <Reveal className="flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-ink">Recent sessions</h3>
          <Link href="/history" className="text-[14px] font-medium text-[#93C5FD] transition-colors hover:text-[#BFDBFE]">View all</Link>
        </Reveal>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[74px] animate-pulse rounded-[16px] border border-line bg-[rgba(20,22,29,0.4)]" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <Reveal className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-line bg-[rgba(20,22,29,0.4)] px-6 py-12 text-center">
            <p className="text-[15px] font-medium text-ink">No sessions yet</p>
            <p className="max-w-[360px] text-[14px] text-muted">Your practice calls will appear here once you finish your first roleplay.</p>
            <Cta href="/setup" variant="ghost" className="mt-1">Start your first</Cta>
          </Reveal>
        ) : (
          recent.map((s, i) => (
            <Reveal key={s.id} delay={i * 70}>
              <SessionRow s={s} />
            </Reveal>
          ))
        )}
      </section>
    </NavShell>
  );
}
