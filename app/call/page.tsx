"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { buyerSessionConfig } from "@/lib/buyerPersona";
import { loadSessionConfig, saveSession } from "@/lib/sessionStore";
import type { SessionConfig } from "@/lib/types";
import { Orb } from "@/components/call/Orb";
import { CallControls } from "@/components/call/CallControls";
import { InstructionsPanel } from "@/components/call/InstructionsPanel";
import { Cta } from "@/components/ui/Cta";
import { Reveal } from "@/components/ui/Reveal";

const SPEAKER_LABEL: Record<string, string> = {
  user: "You're speaking",
  buyer: "Buyer is speaking",
  silent: "Listening…",
};

// Loads the SessionConfig produced by /setup (falling back to the hardcoded
// buyer for a direct visit), then mounts the call once it's ready — so the
// hook is created exactly once with a stable config.
export default function CallPage() {
  const [config, setConfig] = useState<SessionConfig | null>(null);
  useEffect(() => {
    setConfig(loadSessionConfig() ?? buyerSessionConfig);
  }, []);

  if (!config) {
    return (
      <main className="mesh-bg flex min-h-[100dvh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-ambient-pulse rounded-full" style={{ backgroundImage: "linear-gradient(135deg,#3B82F6,#2563EB)", boxShadow: "0 0 40px 4px rgba(37,99,235,0.5)" }} />
        <p className="text-sm text-muted">Preparing your call…</p>
      </main>
    );
  }
  return <CallScreen config={config} />;
}

function CallScreen({ config }: { config: SessionConfig }) {
  const router = useRouter();
  const {
    status,
    error,
    speaker,
    transcript,
    isMuted,
    localAnalyser,
    remoteAnalyser,
    start,
    toggleMute,
    endCall,
  } = useRealtimeSession(config);

  // Stamp when the call actually began so the report can show a duration.
  const startedAtRef = useRef<number>(0);

  const handleStart = () => {
    startedAtRef.current = Date.now();
    start();
  };

  // Phase 3 -> 4 seam: capture the completed transcript, persist the finished
  // session, and hand off to the report. saveSession is now ASYNC — it POSTs to
  // the DB, which also scores the call at save time — so we await the new id and
  // navigate to that specific report. (Scoring adds a few seconds; the screen
  // shows "Call ended" meanwhile, and the controls are already gone.)
  const handleEnd = async () => {
    const finalTranscript = endCall();
    const id = await saveSession({
      config,
      transcript: finalTranscript,
      endedAt: Date.now(),
      durationMs: startedAtRef.current ? Date.now() - startedAtRef.current : 0,
    });
    router.push(`/report?id=${encodeURIComponent(id)}`);
  };

  // Keep the transcript scrolled to the latest line.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [transcript]);

  const live = status === "live";

  return (
    <main className="mesh-bg flex min-h-[100dvh] flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:p-10">
      <Reveal as="div" className="lg:w-auto">
        <InstructionsPanel config={config} />
      </Reveal>

      <Reveal as="section" delay={80} className="flex flex-1 flex-col items-center justify-between gap-6 rounded-2xl glass p-6">
        {/* Orb + status */}
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <Orb
            speaker={speaker}
            status={status}
            localAnalyser={localAnalyser}
            remoteAnalyser={remoteAnalyser}
          />
          <div className="flex flex-col items-center gap-2">
            {live && (
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[12px] font-medium text-muted">
                <span className="h-1.5 w-1.5 animate-ambient-pulse rounded-full bg-success" />
                Live
              </span>
            )}
            <p className="text-[15px] text-muted">
              {live
                ? SPEAKER_LABEL[speaker]
                : status === "connecting"
                ? "Connecting…"
                : status === "ended"
                ? "Call ended"
                : status === "error"
                ? "Something went wrong"
                : "Ready when you are"}
            </p>
          </div>

          {status === "idle" && (
            <Cta
              onClick={handleStart}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>}
            >
              Start call
            </Cta>
          )}

          {status === "error" && (
            <div className="max-w-sm rounded-[14px] border border-danger/40 bg-danger/[0.12] p-3.5 text-center text-[14px] leading-[21px] text-[#FCA5A5]">
              {error}
            </div>
          )}
        </div>

        {/* Controls */}
        {(live || status === "connecting") && (
          <CallControls
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onEndCall={handleEnd}
            disabled={status === "connecting"}
          />
        )}
      </Reveal>

      {/* Live transcript */}
      <Reveal as="aside" delay={160} className="flex w-full flex-col rounded-2xl glass p-5 lg:max-w-sm">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          Transcript
        </h2>
        <div ref={scrollRef} className="flex max-h-[40vh] flex-1 flex-col gap-3.5 overflow-y-auto text-sm lg:max-h-none">
          {transcript.length === 0 && (
            <p className="text-neutral-600">The conversation will appear here as you talk.</p>
          )}
          {transcript.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1">
              <span
                className={`text-[12px] font-semibold ${
                  entry.role === "user" ? "text-[#22D3EE]" : "text-[#60A5FA]"
                }`}
              >
                {entry.role === "user" ? "You" : "Buyer"}
              </span>
              <p className="text-[14px] leading-[21px] text-[#D7DAE3]">{entry.text}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </main>
  );
}
