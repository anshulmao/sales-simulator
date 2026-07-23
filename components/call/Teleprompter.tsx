"use client";

import type { CoachPhase } from "@/hooks/useLiveCoach";

type CallStatus = "idle" | "connecting" | "live" | "ended" | "error";

type Props = {
  enabled: boolean;
  status: CallStatus;
  suggestion: string | null;
  phase: CoachPhase;
  onToggle: () => void;
  onRetry: () => void;
};

export function Teleprompter({
  enabled,
  status,
  suggestion,
  phase,
  onToggle,
  onRetry,
}: Props) {
  if (!enabled) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="group flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3.5 py-2 text-xs font-medium text-neutral-400 backdrop-blur-md transition hover:border-primary/40 hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-600 transition-colors group-hover:bg-primary" />
        Live guidance off
        <span className="text-neutral-600 group-hover:text-primary">Show</span>
      </button>
    );
  }

  const live = status === "live";
  const isUpdating = phase === "loading";
  const hasError = phase === "error";

  let message = suggestion;
  if (!message && status === "idle") {
    message = "Guidance will appear here when the call starts.";
  } else if (!message && status === "connecting") {
    message = "Preparing live guidance…";
  } else if (!message && status === "ended") {
    message = "Call complete.";
  } else if (!message && hasError) {
    message = "Guidance unavailable";
  } else if (!message) {
    message = "Listening for the conversation…";
  }

  return (
    <div className="relative w-full max-w-[680px] overflow-hidden rounded-[16px] border border-white/[0.12] bg-[#090c14]/90 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent transition-opacity ${
          live ? "opacity-100" : "opacity-40"
        }`}
      />

      <div className="flex items-center justify-between gap-4 px-4 pt-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${
              live && !hasError
                ? "bg-secondary shadow-[0_0_12px_rgba(6,182,212,0.9)]"
                : hasError
                ? "bg-warning"
                : "bg-neutral-600"
            }`}
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Live guidance
          </span>
          {isUpdating && suggestion ? (
            <span className="text-[10px] text-neutral-600">Updating…</span>
          ) : null}
          {hasError && suggestion ? (
            <span className="text-[10px] text-warning/80">
              Couldn&apos;t refresh
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="text-[11px] font-medium text-neutral-600 transition hover:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Hide live guidance"
        >
          Hide
        </button>
      </div>

      <div className="px-4 pb-4 pt-2 sm:px-7 sm:pb-5 sm:pt-2.5">
        <p
          aria-live="polite"
          aria-atomic="true"
          className={`mx-auto max-w-[590px] text-center text-[17px] font-medium leading-[1.45] tracking-[-0.012em] sm:text-[20px] ${
            suggestion ? "text-[#F4F7FF]" : "text-neutral-500"
          }`}
        >
          {message}
        </p>

        {hasError && !suggestion ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={!live}
            className="mx-auto mt-3 block rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-primary/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
