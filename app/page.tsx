import Link from "next/link";

const NAV = [
  { label: "Home", href: "/", active: true, icon: "M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" },
  { label: "Session history", href: "/", icon: "M3 3v5h5 M3.05 13A9 9 0 1 0 6 5.3L3 8 M12 7v5l4 2" },
  { label: "Progress", href: "/", icon: "M3 3v18h18 M7 15l4-5 3 3 5-7" },
  { label: "Settings", href: "/", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
];

const SESSIONS = [
  { role: "VP of Operations · Discovery", meta: "Today, 11:20am · 8 min · High resistance", score: 82, color: "#22C55E", grad: "linear-gradient(135deg,#2563EB,#1E3A8A)" },
  { role: "CFO · Objection handling", meta: "Yesterday, 4:05pm · 12 min · Medium resistance", score: 74, color: "#F59E0B", grad: "linear-gradient(135deg,#06B6D4,#0E7490)" },
  { role: "Procurement Lead · Closing", meta: "Mon, 9:30am · 6 min · High resistance", score: 66, color: "#EF4444", grad: "linear-gradient(135deg,#7C5CFF,#4C1D95)" },
];

const STATS = [
  { label: "Avg. overall score", value: "78", note: "▲ 6 vs last week", noteColor: "#22C55E" },
  { label: "Objection handling", value: "71", note: "Focus area", noteColor: "#F59E0B" },
  { label: "Talk / listen ratio", value: "43/57", note: "Healthy balance", noteColor: "#22C55E" },
];

export default function Home() {
  return (
    <main className="mesh-bg flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-[248px] shrink-0 flex-col gap-8 border-r border-line bg-[rgba(20,22,29,0.55)] px-5 py-7">
        <div className="flex items-center gap-3 px-2">
          <div
            className="h-[34px] w-[34px] rounded-[11px]"
            style={{
              backgroundImage:
                "radial-gradient(60% 60% at 35% 30%,#93C5FD,rgba(147,197,253,0)), linear-gradient(135deg,#2563EB,#1E3A8A)",
              boxShadow: "0 0 24px 2px rgba(37,99,235,0.5)",
            }}
          />
          <span className="text-[17px] font-semibold tracking-tight text-ink">Salescoach</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[15px] font-medium transition-colors ${
                n.active
                  ? "border border-primary/30 bg-primary/[0.16] text-ink"
                  : "text-muted hover:bg-white/5"
              }`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={n.active ? "#93C5FD" : "#8A90A0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.icon} />
              </svg>
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-8 px-12 py-10">
        <header className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[30px] font-semibold tracking-tight text-ink">Good afternoon, William</h1>
            <p className="text-[15px] text-muted">You've run 12 calls this month · 3-day streak</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full text-[16px] font-semibold text-white" style={{ backgroundImage: "linear-gradient(135deg,#06B6D4,#2563EB)" }}>
            WK
          </div>
        </header>

        {/* Hero CTA */}
        <section
          className="flex items-center justify-between overflow-hidden rounded-[22px] border border-primary/35 p-8"
          style={{
            backgroundColor: "rgba(20,22,29,0.5)",
            backgroundImage:
              "radial-gradient(60% 120% at 88% 20%, rgba(37,99,235,0.35), transparent 60%), radial-gradient(50% 120% at 100% 100%, rgba(124,92,255,0.25), transparent 60%)",
          }}
        >
          <div className="flex max-w-[560px] flex-col gap-4">
            <span className="text-[13px] font-semibold tracking-[0.12em] text-[#93C5FD]">READY TO PRACTISE</span>
            <h2 className="text-[28px] font-semibold leading-[34px] tracking-tight text-ink">
              Run a live roleplay with an AI buyer and get scored in real time.
            </h2>
            <Link
              href="/setup"
              className="mt-1 flex items-center gap-2.5 self-start rounded-full px-6 py-3.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ backgroundImage: "linear-gradient(135deg,#3B82F6,#2563EB)", boxShadow: "0 8px 30px rgba(37,99,235,0.45)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
              Start new session
            </Link>
          </div>
          <div
            className="h-[150px] w-[150px] shrink-0 animate-blob-morph"
            style={{
              borderRadius: "47% 53% 55% 45% / 52% 46% 54% 48%",
              backgroundImage:
                "radial-gradient(42% 40% at 34% 28%, #DBEAFE 0%, rgba(219,234,254,0) 62%), radial-gradient(90% 90% at 50% 52%, #2563EB 0%, #1E3A8A 100%)",
              boxShadow: "0 0 90px 12px rgba(37,99,235,0.55)",
            }}
          />
        </section>

        {/* Stat tiles */}
        <section className="flex gap-5">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-1 flex-col gap-2.5 rounded-[18px] border border-line bg-[rgba(20,22,29,0.5)] p-[22px]">
              <span className="text-[13px] font-medium text-muted">{s.label}</span>
              <span className="text-[34px] font-semibold tracking-tight text-ink">{s.value}</span>
              <span className="text-[13px] font-medium" style={{ color: s.noteColor }}>{s.note}</span>
            </div>
          ))}
        </section>

        {/* Recent sessions */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-semibold text-ink">Recent sessions</h3>
            <Link href="/" className="text-[14px] font-medium text-[#93C5FD]">View all</Link>
          </div>
          {SESSIONS.map((s) => (
            <Link
              key={s.role}
              href="/report"
              className="flex items-center gap-4 rounded-[16px] border border-line bg-[rgba(20,22,29,0.5)] px-5 py-4 transition-colors hover:bg-white/[0.04]"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl" style={{ backgroundImage: s.grad }} />
              <div className="flex flex-1 flex-col gap-[3px]">
                <span className="text-[15px] font-semibold text-ink">{s.role}</span>
                <span className="text-[13px] text-muted">{s.meta}</span>
              </div>
              <div className="flex w-16 shrink-0 flex-col items-end gap-0.5">
                <span className="text-[22px] font-semibold" style={{ color: s.color }}>{s.score}</span>
                <span className="text-[12px] font-medium text-muted">score</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9 18l6-6-6-6" /></svg>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
