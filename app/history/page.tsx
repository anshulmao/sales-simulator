"use client";

import { Reveal } from "@/components/ui/Reveal";
import { Cta } from "@/components/ui/Cta";
import { NavShell } from "@/components/nav/NavShell";
import { SessionRow } from "@/components/session/SessionRow";
import { useSessions } from "@/hooks/useSessions";

export default function History() {
  const { sessions, loading } = useSessions();
  const list = sessions ?? [];

  return (
    <NavShell>
      <Reveal as="header" className="flex flex-col gap-1.5">
        <span className="w-max rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#93C5FD]">Session history</span>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">Your practice calls</h1>
        <p className="text-[14px] text-muted sm:text-[15px]">
          {loading ? "Loading…" : `${list.length} ${list.length === 1 ? "session" : "sessions"} · newest first`}
        </p>
      </Reveal>

      <section className="flex flex-col gap-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-[16px] border border-line bg-[rgba(20,22,29,0.4)]" />
          ))
        ) : list.length === 0 ? (
          <Reveal className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-line bg-[rgba(20,22,29,0.4)] px-6 py-16 text-center">
            <p className="text-[15px] font-medium text-ink">No sessions yet</p>
            <p className="max-w-[360px] text-[14px] text-muted">Every roleplay you finish is saved here with its transcript and score.</p>
            <Cta href="/setup" variant="ghost" className="mt-1">Start your first</Cta>
          </Reveal>
        ) : (
          list.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i, 8) * 50}>
              <SessionRow s={s} />
            </Reveal>
          ))
        )}
      </section>
    </NavShell>
  );
}
