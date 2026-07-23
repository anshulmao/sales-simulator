"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionConfig, TranscriptEntry } from "@/lib/types";

type CallStatus = "idle" | "connecting" | "live" | "ended" | "error";
type Speaker = "user" | "buyer" | "silent";
export type CoachPhase = "idle" | "loading" | "ready" | "error";

type UseLiveCoachArgs = {
  config: SessionConfig;
  transcript: TranscriptEntry[];
  completedBuyerTurnId: string | null;
  status: CallStatus;
  speaker: Speaker;
  enabled: boolean;
};

export function useLiveCoach({
  config,
  transcript,
  completedBuyerTurnId,
  status,
  speaker,
  enabled,
}: UseLiveCoachArgs) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [phase, setPhase] = useState<CoachPhase>("idle");

  const configRef = useRef(config);
  const transcriptRef = useRef(transcript);
  const speakerRef = useRef(speaker);
  const suggestionRef = useRef<string | null>(null);
  const queuedSuggestionRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestSequenceRef = useRef(0);
  const wasActiveRef = useRef(false);
  const lastRequestedTurnRef = useRef<string | null>(null);

  configRef.current = config;
  transcriptRef.current = transcript;
  speakerRef.current = speaker;

  const requestSuggestion = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const sequence = ++requestSequenceRef.current;
    setPhase("loading");

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: configRef.current,
          transcript: transcriptRef.current,
        }),
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error("Live guidance could not refresh.");
      }

      const nextSuggestion =
        typeof data === "object" &&
        data !== null &&
        "suggestion" in data &&
        typeof data.suggestion === "string"
          ? data.suggestion.trim()
          : "";

      if (!nextSuggestion) {
        throw new Error("Live guidance returned an empty response.");
      }

      if (
        controller.signal.aborted ||
        sequence !== requestSequenceRef.current
      ) {
        return;
      }

      if (speakerRef.current === "user") {
        queuedSuggestionRef.current = nextSuggestion;
        return;
      }

      suggestionRef.current = nextSuggestion;
      setSuggestion(nextSuggestion);
      setPhase("ready");
    } catch (error) {
      if (
        controller.signal.aborted ||
        sequence !== requestSequenceRef.current
      ) {
        return;
      }
      setPhase("error");
    }
  }, []);

  // Request once when coaching becomes active, then exactly once for each
  // completed buyer turn. Transcript deltas never enter this dependency list.
  useEffect(() => {
    const active = enabled && status === "live";

    if (!active) {
      abortRef.current?.abort();
      abortRef.current = null;
      queuedSuggestionRef.current = null;
      if (!enabled) {
        lastRequestedTurnRef.current = null;
      }
      setPhase(suggestionRef.current ? "ready" : "idle");
      wasActiveRef.current = false;
      return;
    }

    const becameActive = !wasActiveRef.current;
    const hasNewBuyerTurn =
      completedBuyerTurnId !== null &&
      completedBuyerTurnId !== lastRequestedTurnRef.current;

    wasActiveRef.current = true;

    if (becameActive || hasNewBuyerTurn) {
      lastRequestedTurnRef.current = completedBuyerTurnId;
      void requestSuggestion();
    }
  }, [completedBuyerTurnId, enabled, requestSuggestion, status]);

  // A response that arrives while the rep is talking waits here. It becomes
  // visible only once they stop, so the line never changes under their eyes.
  useEffect(() => {
    if (speaker === "user" || !queuedSuggestionRef.current) return;
    const queued = queuedSuggestionRef.current;
    queuedSuggestionRef.current = null;
    suggestionRef.current = queued;
    setSuggestion(queued);
    setPhase("ready");
  }, [speaker]);

  useEffect(() => {
    return () => {
      requestSequenceRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  return {
    suggestion,
    phase,
    retry: requestSuggestion,
  };
}
