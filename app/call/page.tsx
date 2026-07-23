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
      <main className="mesh-bg flex min-h-screen items-center justify-center">
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

  // Phase 3 -> 4 seam: capture the completed transcript, stash the finished
  // session, and hand off to the report. We do NOT score here — that's the
  // evaluation model's job (teammate B).
  const handleEnd = () => {
    const finalTranscript = endCall();
    saveSession({
      config,
      transcript: finalTranscript,
      endedAt: Date.now(),
      durationMs: startedAtRef.current ? Date.now() - startedAtRef.current : 0,
    });
    router.push("/report");
  };

  // Keep the transcript scrolled to the latest line.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [transcript]);

  return (
    <main className="mesh-bg flex min-h-screen flex-col gap-6 p-6 lg:flex-row lg:p-10">
      <InstructionsPanel config={config} />

      <section className="flex flex-1 flex-col items-center justify-between gap-6 rounded-2xl glass p-6">
        {/* Orb + status */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Orb
            speaker={speaker}
            status={status}
            localAnalyser={localAnalyser}
            remoteAnalyser={remoteAnalyser}
          />
          <p className="text-sm text-muted">
            {status === "live"
              ? SPEAKER_LABEL[speaker]
              : status === "connecting"
              ? "Connecting…"
              : status === "ended"
              ? "Call ended"
              : status === "error"
              ? "Something went wrong"
              : "Ready when you are"}
          </p>

          {status === "idle" && (
            <button
              onClick={handleStart}
              className="rounded-full px-8 py-3 font-medium text-white transition-transform hover:scale-[1.02]"
              style={{
                backgroundImage: "linear-gradient(135deg,#3B82F6,#2563EB)",
                boxShadow: "0 8px 30px rgba(37,99,235,0.45)",
              }}
            >
              Start call
            </button>
          )}

          {status === "error" && (
            <div className="max-w-sm rounded-lg border border-red-800 bg-red-950/50 p-3 text-center text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* Controls */}
        {(status === "live" || status === "connecting") && (
          <CallControls
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onEndCall={handleEnd}
            disabled={status === "connecting"}
          />
        )}
      </section>

      {/* Live transcript */}
      <aside className="flex w-full max-w-sm flex-col rounded-2xl glass p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Transcript
        </h2>
        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto text-sm">
          {transcript.length === 0 && (
            <p className="text-neutral-600">The conversation will appear here as you talk.</p>
          )}
          {transcript.map((entry) => (
            <div key={entry.id}>
              <span
                className={`text-xs font-semibold ${
                  entry.role === "user" ? "text-emerald-400" : "text-indigo-400"
                }`}
              >
                {entry.role === "user" ? "You" : "Buyer"}
              </span>
              <p className="text-neutral-200">{entry.text}</p>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
