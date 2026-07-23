"use client";

import { useMemo } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Cta } from "@/components/ui/Cta";
import { NavShell } from "@/components/nav/NavShell";
import { useSessions } from "@/hooks/useSessions";
import { scoreColor, relDay } from "@/lib/format";

export default function Progress() {
  const { sessions, loading } = useSessions();

  const { tiles, trend, hasScores } = useMemo(() => {
    const list = sessions ?? [];
    const scored = list
      .filter((s) => s.overallScore != null)
      .sort((a, b) => a.endedAt - b.endedAt);
    const vals = scored.map((s) => s.overallScore as number);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    const best = vals.length ? Math.max(...vals) : null;
    const weekAgo = Date.now() - 7 * 86_400_000;
    const thisWeek = list.filter((s) => s.endedAt >= weekAgo).length;
    return {
      hasScores: vals.length > 0,
      trend: scored.slice(-12),
      tiles: [
        { label: "Sessions run", value: list.length.toString(), note: "all time" },
        { label: "Avg. overall score", value: avg?.toString() ?? "—", note: "across scored calls" },
        { label: "Best score", value: best?.toString() ?? "—", note: "personal best" },
        { label: "This week", value: thisWeek.toString(), note: "sessions" },
      ],
    };
  }, [sessions]);

  return (
    <NavShell>
      <Reveal as="header" className="flex flex-col gap-1.5">
        <span className="w-max rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93C5FD]">Progress</span>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">How you&apos;re trending</h1>
        <p className="text-[14px] text-muted sm:text-[15px]">Aggregated from your saved sessions.</p>
      </Reveal>

      {/* Aggregate tiles */}
      <section className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <Reveal
            key={t.label}
            delay={i * 60}
            className="flex flex-col gap-2 rounded-[18px] border border-line bg-[rgba(20,22,29,0.5)] p-[20px] transition-colors duration-300 ease-spring hover:border-white/15"
          >
            <span className="text-[13px] font-medium text-muted">{t.label}</span>
            <span className="text-[30px] font-semibold tracking-tight text-ink sm:text-[34px]">{loading ? "—" : t.value}</span>
            <span className="text-[12px] font-medium text-muted">{t.note}</span>
          </Reveal>
        ))}
      </section>

      {/* Score trend */}
      <Reveal as="section" delay={120} className="bezel">
        <div className="bezel-inner flex flex-col gap-6 px-6 py-7 sm:px-8">
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-semibold text-ink">Score over time</span>
            <span className="text-[13px] text-muted">last {trend.length || 0}</span>
          </div>

          {loading ? (
            <div className="h-[180px] animate-pulse rounded-xl bg-white/[0.04]" />
          ) : !hasScores ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-[15px] font-medium text-ink">No scored sessions yet</p>
              <p className="max-w-[380px] text-[14px] text-muted">Finish a roleplay and your scores will chart here so you can watch the trend.</p>
              <Cta href="/setup" variant="ghost" className="mt-1">Run a session</Cta>
            </div>
          ) : (
            <div className="flex h-[180px] items-end gap-2 sm:gap-3">
              {trend.map((s) => {
                const v = s.overallScore as number;
                return (
                  <div key={s.id} className="group relative flex flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className="w-full rounded-t-md transition-all duration-700 ease-spring"
                      style={{ height: `${Math.max(6, v)}%`, backgroundColor: scoreColor(v) }}
                    />
                    <span className="text-[11px] font-medium text-muted">{v}</span>
                    <span className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-md border border-line bg-[#0B0D13] px-2 py-1 text-[11px] text-ink opacity-0 transition-opacity group-hover:opacity-100">
                      {relDay(s.endedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>
    </NavShell>
  );
}
