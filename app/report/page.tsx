"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  loadSession,
  retrySessionScoring,
  type StoredSession,
} from "@/lib/sessionStore";
import { scoreColor } from "@/lib/format";
import { Cta } from "@/components/ui/Cta";
import { Reveal } from "@/components/ui/Reveal";

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function fmtDuration(ms: number) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m} min ${s.toString().padStart(2, "0")}s`;
}

function fmtMoment(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function clampScore(value: number) {
  return Math.min(10, Math.max(0, value));
}

function Meter({
  label,
  value,
  color,
  animate,
}: {
  label: string;
  value: number;
  color: string;
  animate: boolean;
}) {
  const measured = value >= 0;
  const percentage = measured ? clampScore(value) * 10 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[14px] text-[#D7DAE3]">{label}</span>
        <span
          className="text-[13px] font-semibold"
          style={{ color: measured ? (value < 7 ? color : "#EDEFF4") : "#8A90A0" }}
        >
          {measured ? `${value}/10` : "Not measured"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.08]">
        <div
          className="h-2 rounded-full transition-[width] duration-1000 ease-spring"
          style={{
            width: animate ? `${percentage}%` : "0%",
            backgroundColor: measured ? color : "transparent",
          }}
        />
      </div>
    </div>
  );
}

function ReportLoading() {
  return (
    <main className="mesh-bg flex min-h-[100dvh] flex-col items-center justify-center gap-4">
      <div
        className="h-10 w-10 animate-ambient-pulse rounded-full"
        style={{
          backgroundImage: "linear-gradient(135deg,#3B82F6,#2563EB)",
          boxShadow: "0 0 40px 4px rgba(37,99,235,0.5)",
        }}
      />
      <p className="text-sm text-muted">Loading report…</p>
    </main>
  );
}

function ReportMissing({ message }: { message: string }) {
  return (
    <main className="mesh-bg flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-warning/30 bg-warning/[0.1]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <div className="flex max-w-[440px] flex-col gap-2">
        <h1 className="text-[24px] font-semibold tracking-tight text-ink">Report unavailable</h1>
        <p className="text-[14px] leading-[21px] text-muted">{message}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Cta href="/" variant="ghost">Back to home</Cta>
        <Cta href="/history">Session history</Cta>
      </div>
    </main>
  );
}

export default function ReportPage() {
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [animate, setAnimate] = useState(false);
  const automaticRetryAttempted = useRef(false);

  useEffect(() => {
    let active = true;
    const id = new URLSearchParams(window.location.search).get("id") ?? undefined;

    loadSession(id)
      .then((loaded) => {
        if (active) setSession(loaded);
      })
      .catch(() => {
        if (!active) return;
        setLoadError("The session could not be loaded. Please try again from session history.");
        setSession(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const overall = session?.report?.overall;
  useEffect(() => {
    if (overall == null) {
      setAnimate(false);
      return;
    }

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [overall]);

  // Save-time scoring is the normal path. If it failed, retry once
  // automatically when the report opens; the explicit button remains available
  // if that recovery attempt also fails.
  useEffect(() => {
    if (
      !session ||
      session.report ||
      session.transcript.length === 0 ||
      automaticRetryAttempted.current
    ) {
      return;
    }

    automaticRetryAttempted.current = true;
    setIsRetrying(true);
    setRetryError(null);
    retrySessionScoring(session)
      .then((nextReport) => {
        setSession((current) =>
          current ? { ...current, report: nextReport } : current
        );
      })
      .catch((error) => {
        setRetryError(
          error instanceof Error
            ? error.message
            : "Scoring failed. Please try again."
        );
      })
      .finally(() => setIsRetrying(false));
  }, [session]);

  if (session === undefined) return <ReportLoading />;
  if (session === null) {
    return (
      <ReportMissing
        message={loadError ?? "This session could not be found or is no longer available."}
      />
    );
  }

  const report = session.report;
  const meta = `${session.config.persona.role} · ${cap(session.config.scenario.salesStage)} · ${cap(session.config.persona.resistance)} resistance · ${fmtDuration(session.durationMs)} · ${new Date(session.endedAt).toLocaleString([], { hour: "2-digit", minute: "2-digit" })}`;
  const voice = report
    ? [
        { label: "Clarity", value: report.voice.clarity },
        { label: "Pace & speed", value: report.voice.pace },
        { label: "Tone & pitch", value: report.voice.tone },
      ]
    : [];
  const scenario = report
    ? [
        { label: "Opening", value: report.scenario.opening, color: "#60A5FA" },
        { label: "Discovery & needs", value: report.scenario.discovery, color: "#60A5FA" },
        { label: "Objection handling", value: report.scenario.o, color: "#F59E0B" },
      ]
    : [];

  async function retryScoring() {
    if (!session) return;
    const currentSession = session;
    setIsRetrying(true);
    setRetryError(null);
    try {
      const nextReport = await retrySessionScoring(currentSession);
      setSession((current) =>
        current ? { ...current, report: nextReport } : current
      );
    } catch (error) {
      setRetryError(
        error instanceof Error
          ? error.message
          : "Scoring failed. Please try again."
      );
    } finally {
      setIsRetrying(false);
    }
  }

  const overallColor = report ? scoreColor(report.overall) : "#8A90A0";
  const overallPercentage = report ? clampScore(report.overall) * 10 : 0;

  return (
    <main className="mesh-bg flex min-h-[100dvh] flex-col gap-7 px-5 py-9 sm:px-8 lg:px-12">
      <Reveal as="header" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-[7px]">
          <Link href="/" className="flex w-max items-center gap-2.5 text-[14px] font-medium text-muted transition-colors hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to home
          </Link>
          <h1 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">Session report</h1>
          <p className="text-[14px] text-muted sm:text-[15px]">{meta}</p>
        </div>
        <Cta href="/setup" variant="ghost">Practise again</Cta>
      </Reveal>

      {!report ? (
        <Reveal className="flex flex-col gap-5 rounded-[22px] border border-warning/30 bg-warning/[0.08] px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex max-w-[680px] items-start gap-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/[0.14]">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[18px] font-semibold text-ink">This session is not scored yet</h2>
              <p className="text-[14px] leading-[21px] text-muted">
                {session.transcript.length === 0
                  ? "No transcript was captured, so there is nothing for the evaluator to score."
                  : "The evaluator did not complete during save. Your session and transcript are safe; retry scoring to generate the report."}
              </p>
              {retryError ? (
                <p role="alert" className="mt-1 text-[13px] font-medium text-[#FCA5A5]">
                  {retryError}
                </p>
              ) : null}
            </div>
          </div>
          <Cta
            onClick={retryScoring}
            disabled={isRetrying || session.transcript.length === 0}
            className="shrink-0 justify-center"
          >
            {isRetrying ? "Scoring…" : "Retry scoring"}
          </Cta>
        </Reveal>
      ) : (
        <>
          <section className="flex flex-col items-stretch gap-6 lg:flex-row">
            <Reveal className="bezel w-full shrink-0 lg:w-[400px]">
              <div className="bezel-inner flex flex-col items-center justify-center gap-[22px] p-9" style={{ backgroundImage: `radial-gradient(70% 60% at 50% 0%, ${overallColor}22, transparent 65%)` }}>
                <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full" style={{ backgroundImage: `conic-gradient(${overallColor} 0% ${overallPercentage}%, rgba(255,255,255,0.07) ${overallPercentage}% 100%)` }}>
                  <div className="flex h-[158px] w-[158px] flex-col items-center justify-center rounded-full bg-[#0B0D13]">
                    <span className="text-[56px] font-semibold leading-none tracking-[-0.03em] text-ink">{report.overall}</span>
                    <span className="mt-1 text-[13px] font-medium tracking-[0.06em] text-muted">OUT OF 10</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-center text-[20px] font-semibold text-ink">{report.headline}</span>
                  <span className="text-center text-[14px] leading-[21px] text-muted">{report.summary}</span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100} className="bezel flex-1">
              <div className="bezel-inner flex flex-col gap-6 px-6 py-[30px] sm:px-[34px]">
                <span className="text-[17px] font-semibold text-ink">Score breakdown</span>
                <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
                  <div className="flex flex-1 flex-col gap-[18px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-semibold tracking-[0.1em] text-[#22D3EE]">VOICE</span>
                      <span className="text-[11px] text-muted">audio analysis unavailable</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {voice.map((metric) => (
                        <Meter key={metric.label} label={metric.label} value={metric.value} color="#22D3EE" animate={animate} />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-[18px]">
                    <span className="text-[13px] font-semibold tracking-[0.1em] text-[#93C5FD]">SCENARIO</span>
                    <div className="flex flex-col gap-4">
                      {scenario.map((metric) => (
                        <Meter key={metric.label} label={metric.label} value={metric.value} color={metric.color} animate={animate} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          <section className="flex flex-col items-stretch gap-6 lg:flex-row">
            <Reveal className="flex flex-1 basis-0 flex-col gap-5 rounded-[22px] border border-line bg-[rgba(20,22,29,0.5)] px-6 py-7 sm:px-[30px]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-success/[0.16]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span className="text-[17px] font-semibold text-ink">What worked</span>
              </div>
              {report.strengths.length > 0 ? (
                report.strengths.map((item) => (
                  <div key={item.title} className="flex flex-col gap-1">
                    <span className="text-[15px] font-semibold text-ink">{item.title}</span>
                    <span className="text-[14px] leading-[21px] text-muted">{item.detail}</span>
                  </div>
                ))
              ) : (
                <p className="text-[14px] text-muted">No rubric strengths were recorded for this session.</p>
              )}
            </Reveal>

            <Reveal delay={100} className="flex flex-1 basis-0 flex-col gap-5 rounded-[22px] border border-line bg-[rgba(20,22,29,0.5)] px-6 py-7 sm:px-[30px]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-warning/[0.16]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20V10M18 20V4M6 20v-4" />
                  </svg>
                </div>
                <span className="text-[17px] font-semibold text-ink">Areas to work on</span>
              </div>
              {report.improvements.length > 0 ? (
                report.improvements.map((item) => (
                  <div key={item.title} className="flex flex-col gap-1">
                    <span className="text-[15px] font-semibold text-ink">{item.title}</span>
                    <span className="text-[14px] leading-[21px] text-muted">{item.detail}</span>
                  </div>
                ))
              ) : (
                <p className="text-[14px] text-muted">No rubric improvements were recorded for this session.</p>
              )}
            </Reveal>
          </section>

          {report.keyMoments.length > 0 ? (
            <Reveal as="section" className="flex flex-col gap-5 rounded-[22px] border border-line bg-[rgba(20,22,29,0.5)] px-6 py-7 sm:px-[34px]">
              <span className="text-[17px] font-semibold text-ink">Key moments</span>
              <div className="grid gap-3 md:grid-cols-2">
                {report.keyMoments.map((moment, index) => (
                  <div key={`${moment.atMs}-${moment.label}-${index}`} className="flex gap-4 rounded-[14px] border border-line bg-white/[0.02] px-4 py-4">
                    <span className="mt-0.5 shrink-0 rounded-full bg-primary/[0.16] px-2.5 py-1 text-[12px] font-semibold text-[#93C5FD]">{fmtMoment(moment.atMs)}</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-semibold text-ink">{moment.label}</span>
                      <span className="text-[13px] leading-[19px] text-muted">{moment.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          ) : null}
        </>
      )}

      <Reveal as="section" className="flex flex-col gap-4 rounded-[22px] border border-line bg-[rgba(20,22,29,0.5)] px-6 py-7 sm:px-[34px]">
        <span className="text-[17px] font-semibold text-ink">Full transcript</span>
        {session.transcript.length === 0 ? (
          <p className="text-[14px] text-muted">No transcript was captured for this call.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {session.transcript.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1">
                <span className={`text-[13px] font-semibold ${entry.role === "user" ? "text-[#22D3EE]" : "text-[#60A5FA]"}`}>
                  {entry.role === "user" ? "You" : "Buyer"}
                </span>
                <p className="text-[15px] leading-[23px] text-[#D7DAE3]">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </Reveal>

      {report ? (
        <Reveal as="section" className="flex flex-col gap-5 rounded-[22px] border border-violet/30 px-6 py-6 sm:px-[30px] md:flex-row md:items-center md:justify-between" style={{ backgroundColor: "rgba(20,22,29,0.5)", backgroundImage: "radial-gradient(50% 140% at 90% 50%, rgba(124,92,255,0.22), transparent 60%)" }}>
          <div className="flex items-center gap-[18px]">
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px]" style={{ backgroundImage: "linear-gradient(135deg,#7C5CFF,#4C1D95)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold tracking-[0.1em] text-[#B9A6FF]">RECOMMENDED NEXT</span>
              <span className="max-w-[760px] text-[17px] font-semibold text-ink sm:text-[18px]">{report.nextStep}</span>
            </div>
          </div>
          <Cta href="/setup" variant="violet" className="shrink-0">Start next session</Cta>
        </Reveal>
      ) : null}
    </main>
  );
}
