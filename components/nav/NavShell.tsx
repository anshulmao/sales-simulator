"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSettings } from "@/hooks/useSettings";

const NAV = [
  { label: "Home", href: "/", icon: "M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" },
  { label: "Session history", href: "/history", icon: "M3 3v5h5 M3.05 13A9 9 0 1 0 6 5.3L3 8 M12 7v5l4 2" },
  { label: "Progress", href: "/progress", icon: "M3 3v18h18 M7 15l4-5 3 3 5-7" },
  { label: "Settings", href: "/settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8a1.65 1.65 0 0 0 1.51 1H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" },
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length === 0
    ? "?"
    : parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full text-[16px] font-semibold text-white" style={{ backgroundImage: "linear-gradient(135deg,#06B6D4,#2563EB)" }}>
      {initials(name)}
    </div>
  );
}

// App chrome for the dashboard-level screens (Home, History, Progress,
// Settings): a persistent sidebar on desktop and a brand strip + scrollable
// nav pills on mobile. The focus flows (Setup, Call, Report) intentionally
// render without this shell. Active route is derived from the pathname.
export function NavShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { settings } = useSettings();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <main className="mesh-bg flex min-h-[100dvh]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[248px] shrink-0 flex-col gap-8 border-r border-line bg-[rgba(20,22,29,0.55)] px-5 py-7 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.label}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-[11px] text-[15px] font-medium transition-all duration-300 ease-spring ${
                  active
                    ? "border border-primary/30 bg-primary/[0.16] text-ink"
                    : "border border-transparent text-muted hover:translate-x-0.5 hover:bg-white/5 hover:text-ink"
                }`}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? "#93C5FD" : "#8A90A0"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors group-hover:stroke-[#B4B9C6]">
                  <path d={n.icon} />
                </svg>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5">
          <Avatar name={settings.displayName} />
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-ink">{settings.displayName}</span>
            <span className="text-[12px] text-muted">Sales rep</span>
          </div>
        </div>
      </aside>

      {/* Content column */}
      <div className="flex flex-1 flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        {/* Mobile chrome */}
        <div className="flex flex-col gap-4 lg:hidden">
          <div className="flex items-center justify-between">
            <Logo />
            <Avatar name={settings.displayName} />
          </div>
          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {NAV.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.label}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[14px] font-medium transition-all duration-300 ease-spring active:scale-[0.96] ${
                    active
                      ? "border-primary/40 bg-primary/[0.16] text-ink"
                      : "border-line text-muted hover:text-ink"
                  }`}
                >
                  {n.label === "Session history" ? "History" : n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {children}
      </div>
    </main>
  );
}
