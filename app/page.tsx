import Link from "next/link";
import { Cta } from "@/components/ui/Cta";
import { Reveal } from "@/components/ui/Reveal";

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

function Logo() {
  return (
    <div className="flex items-center gap-3">
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
  );
}

export default function Home() {
  return (
    <main className="mesh-bg flex min-h-[100dvh]">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-[248px] shrink-0 flex-col gap-8 border-r border-line bg-[rgba(20,22,29,0.55)] px-5 py-7 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-[11px] text-[15px] font-medium transition-all duration-300 ease-spring ${
                n.active
                  ? "border border-primary/30 bg-primary/[0.16] text-ink"
                  : "border border-transparent text-muted hover:translate-x-0.5 hover:bg-white/5 hover:text-ink"
              }`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={n.active ? "#93C5FD" : "#8A90A0"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors group-hover:stroke-[#B4B9C6]">
                <path d={n.icon} />
              </svg>
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        {/* Mobile brand strip */}
        <div className="flex items-center justify-between lg:hidden">
          <Logo />
          <div className="flex h-11 w-11 items-center justify-center rounded-full text-[16px] font-semibold text-white" style={{ backgroundImage: "linear-gradient(135deg,#06B6D4,#2563EB)" }}>WK</div>
        </div>

        <Reveal as="header" className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">Good afternoon, William</h1>
            <p className="text-[14px] text-muted sm:text-[15px]">You&apos;ve run 12 calls this month · 3-day streak</p>
          </div>
          <div className="hidden h-11 w-11 items-center justify-center rounded-full text-[16px] font-semibold text-white lg:flex" style={{ backgroundImage: "linear-gradient(135deg,#06B6D4,#2563EB)" }}>
            WK
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
          {STATS.map((s, i) => (
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
            <Link href="/" className="text-[14px] font-medium text-[#93C5FD] transition-colors hover:text-[#BFDBFE]">View all</Link>
          </Reveal>
          {SESSIONS.map((s, i) => (
            <Reveal key={s.role} delay={i * 70} as="div">
              <Link
                href="/report"
                className="group flex items-center gap-4 rounded-[16px] border border-line bg-[rgba(20,22,29,0.5)] px-5 py-4 transition-all duration-300 ease-spring hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="h-10 w-10 shrink-0 rounded-xl transition-transform duration-500 ease-spring group-hover:scale-105" style={{ backgroundImage: s.grad }} />
                <div className="flex flex-1 flex-col gap-[3px]">
                  <span className="text-[15px] font-semibold text-ink">{s.role}</span>
                  <span className="text-[13px] text-muted">{s.meta}</span>
                </div>
                <div className="flex w-16 shrink-0 flex-col items-end gap-0.5">
                  <span className="text-[22px] font-semibold" style={{ color: s.color }}>{s.score}</span>
                  <span className="text-[12px] font-medium text-muted">score</span>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-500 ease-spring group-hover:translate-x-1 group-hover:stroke-[#B4B9C6]"><path d="M9 18l6-6-6-6" /></svg>
              </Link>
            </Reveal>
          ))}
        </section>
      </div>
    </main>
  );
}
