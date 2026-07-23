import Link from "next/link";
import type { SessionSummary } from "@/lib/sessionStore";
import { cap, fmtDuration, relDay, scoreColor, gradFor } from "@/lib/format";

// One past-session row → opens that session's report by id. Shared by the
// dashboard's "Recent sessions" and the full history screen.
export function SessionRow({ s }: { s: SessionSummary }) {
  return (
    <Link
      href={`/report?id=${encodeURIComponent(s.id)}`}
      className="group flex items-center gap-4 rounded-[16px] border border-line bg-[rgba(20,22,29,0.5)] px-5 py-4 transition-all duration-300 ease-spring hover:border-white/15 hover:bg-white/[0.04]"
    >
      <div className="h-10 w-10 shrink-0 rounded-xl transition-transform duration-500 ease-spring group-hover:scale-105" style={{ backgroundImage: gradFor(s.id) }} />
      <div className="flex flex-1 flex-col gap-[3px]">
        <span className="text-[15px] font-semibold text-ink">{s.role} · {cap(s.salesStage)}</span>
        <span className="text-[13px] text-muted">{relDay(s.endedAt)} · {fmtDuration(s.durationMs)} · {cap(s.resistance)} resistance</span>
      </div>
      <div className="flex w-16 shrink-0 flex-col items-end gap-0.5">
        <span className="text-[22px] font-semibold" style={{ color: scoreColor(s.overallScore) }}>{s.overallScore ?? "—"}</span>
        <span className="text-[12px] font-medium text-muted">score</span>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A90A0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-500 ease-spring group-hover:translate-x-1 group-hover:stroke-[#B4B9C6]"><path d="M9 18l6-6-6-6" /></svg>
    </Link>
  );
}
