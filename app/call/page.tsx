"use client";

import { useEffect, useRef } from "react";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { buyerSessionConfig } from "@/lib/buyerPersona";
import { Orb } from "@/components/call/Orb";
import { CallControls } from "@/components/call/CallControls";
import { InstructionsPanel } from "@/components/call/InstructionsPanel";

const SPEAKER_LABEL: Record<string, string> = {
  user: "You're speaking",
  buyer: "Buyer is speaking",
  silent: "Listening…",
};

export default function CallPage() {
  const session = useRealtimeSession(buyerSessionConfig);
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
  } = session;

  // Keep the transcript scrolled to the latest line.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [transcript]);

  return (
    <main className="mesh-bg flex min-h-screen flex-col gap-6 p-6 lg:flex-row lg:p-10">
      <InstructionsPanel />

      <section className="flex flex-1 flex-col items-center justify-between gap-6 rounded-2xl glass p-6">
        {/* Orb + status */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Orb
            speaker={speaker}
            status={status}
            localAnalyser={localAnalyser}
            remoteAnalyser={remoteAnalyser}
          />
          <p className="text-sm text-neutral-400">
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
              onClick={start}
              className="rounded-full bg-indigo-500 px-8 py-3 font-medium text-white transition hover:bg-indigo-400"
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
            onEndCall={endCall}
            disabled={status === "connecting"}
          />
        )}
      </section>

      {/* Live transcript */}
      <aside className="flex w-full max-w-sm flex-col rounded-2xl glass p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Transcript
        </h2>
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto text-sm"
        >
          {transcript.length === 0 && (
            <p className="text-neutral-600">
              The conversation will appear here as you talk.
            </p>
          )}
          {transcript.map((entry) => (
            <div key={entry.id}>
              <span
                className={`text-xs font-semibold ${
                  entry.role === "user"
                    ? "text-emerald-400"
                    : "text-indigo-400"
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
