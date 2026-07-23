"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionConfig, TranscriptEntry } from "@/lib/types";

type Status = "idle" | "connecting" | "live" | "ended" | "error";
type Speaker = "user" | "buyer" | "silent";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_SESSION === "true";
const REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

// Fake lines for mock mode — lets the whole screen run with zero network calls.
const MOCK_SCRIPT: Array<{ role: "user" | "buyer"; text: string }> = [
  { role: "buyer", text: "Hi — I've got about ten minutes, so what's this about?" },
  { role: "user", text: "Appreciate the time. I wanted to understand how your team handles fulfilment right now." },
  { role: "buyer", text: "We manage. It's not perfect, but I'm not convinced we need another tool." },
  { role: "user", text: "Totally fair. Where does it get painful — is it visibility, or the manual work?" },
  { role: "buyer", text: "Honestly? The manual reconciliation at month-end eats my team alive." },
];

export function useRealtimeSession(config: SessionConfig) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [speaker, setSpeaker] = useState<Speaker>("silent");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [localAnalyser, setLocalAnalyser] = useState<AnalyserNode | null>(null);
  const [remoteAnalyser, setRemoteAnalyser] = useState<AnalyserNode | null>(null);

  // Connection objects live in refs, NOT state — they are not render data, and
  // putting them in state causes reconnection loops.
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // StrictMode double-mount guard: a second init while one is in flight (or one
  // is already live) must be a no-op.
  const startedRef = useRef(false);
  // Mock-mode timers so we can clear them on teardown.
  const mockTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Upsert a transcript entry by id. Deltas append; final events replace with
  // the authoritative text. Transcript stays structured data (the contract),
  // never display-formatted strings.
  const upsertTranscript = useCallback(
    (
      id: string,
      role: "user" | "buyer",
      chunk: string,
      mode: "append" | "replace"
    ) => {
      setTranscript((prev) => {
        const idx = prev.findIndex((e) => e.id === id);
        if (idx === -1) {
          return [
            ...prev,
            { id, role, text: chunk, timestamp: Date.now() },
          ];
        }
        const next = [...prev];
        const existing = next[idx];
        next[idx] = {
          ...existing,
          text: mode === "append" ? existing.text + chunk : chunk,
        };
        return next;
      });
    },
    []
  );

  // All UI state (speaker, transcript) derives from data-channel events. No
  // polling, no setInterval to check connection/speaking state.
  const handleServerEvent = useCallback(
    (evt: any) => {
      switch (evt.type) {
        // --- who is speaking ---
        case "input_audio_buffer.speech_started":
          setSpeaker("user");
          break;
        case "input_audio_buffer.speech_stopped":
          setSpeaker((s) => (s === "user" ? "silent" : s));
          break;
        case "response.output_audio.delta":
          setSpeaker("buyer");
          break;
        case "response.output_audio.done":
        case "response.done":
          setSpeaker((s) => (s === "buyer" ? "silent" : s));
          break;

        // --- user's own transcript (needs audio.input.transcription enabled) ---
        case "conversation.item.input_audio_transcription.delta":
          if (evt.item_id) upsertTranscript(evt.item_id, "user", evt.delta ?? "", "append");
          break;
        case "conversation.item.input_audio_transcription.completed":
          if (evt.item_id) upsertTranscript(evt.item_id, "user", evt.transcript ?? "", "replace");
          break;

        // --- assistant (buyer) transcript ---
        case "response.output_audio_transcript.delta":
          if (evt.item_id) upsertTranscript(evt.item_id, "buyer", evt.delta ?? "", "append");
          break;
        case "response.output_audio_transcript.done":
          if (evt.item_id) upsertTranscript(evt.item_id, "buyer", evt.transcript ?? "", "replace");
          break;

        case "error":
          setError(evt.error?.message ?? "Realtime session error.");
          break;
      }
    },
    [upsertTranscript]
  );

  // Full teardown. Order matters: data channel -> peer connection -> local
  // tracks -> AudioContext. Wrong order leaves the mic indicator lit.
  const teardown = useCallback(() => {
    mockTimersRef.current.forEach(clearTimeout);
    mockTimersRef.current = [];

    dcRef.current?.close();
    dcRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;

    setLocalAnalyser(null);
    setRemoteAnalyser(null);
    startedRef.current = false;
  }, []);

  // --- Mock mode: fake transcript + speaker, no network at all ---
  const startMock = useCallback(() => {
    setStatus("live");
    let delay = 600;
    MOCK_SCRIPT.forEach((line, i) => {
      const id = `mock-${i}`;
      const startAt = delay;
      const endAt = delay + 1600;
      mockTimersRef.current.push(
        setTimeout(() => {
          setSpeaker(line.role);
          upsertTranscript(id, line.role, line.text, "replace");
        }, startAt)
      );
      mockTimersRef.current.push(
        setTimeout(() => setSpeaker("silent"), endAt)
      );
      delay = endAt + 400;
    });
  }, [upsertTranscript]);

  const start = useCallback(async () => {
    // Guard: no-op if already started/in-flight (handles StrictMode remount).
    if (startedRef.current) return;
    startedRef.current = true;

    setError(null);
    setTranscript([]);
    setStatus("connecting");

    if (USE_MOCK) {
      startMock();
      return;
    }

    try {
      // 1. Mint ephemeral client secret from our server route.
      const tokenRes = await fetch("/api/session");
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData?.error ?? "Failed to mint session token.");
      }
      const ephemeralKey: string | undefined = tokenData?.value;
      if (!ephemeralKey) {
        throw new Error("Session response did not include a client secret.");
      }

      // 2. Local mic stream.
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      localStreamRef.current = localStream;

      // 3. Peer connection.
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 4. Outbound mic track.
      pc.addTrack(localStream.getTracks()[0]);

      // Analyser on the local mic (drives the orb when the user speaks).
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const localSource = audioCtx.createMediaStreamSource(localStream);
      const lAnalyser = audioCtx.createAnalyser();
      lAnalyser.fftSize = 256;
      localSource.connect(lAnalyser);
      setLocalAnalyser(lAnalyser);

      // 5. Inbound audio -> hidden <audio autoplay> element + remote analyser.
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      pc.ontrack = (e) => {
        const [remoteStream] = e.streams;
        audioEl.srcObject = remoteStream;
        try {
          const remoteSource = audioCtx.createMediaStreamSource(remoteStream);
          const rAnalyser = audioCtx.createAnalyser();
          rAnalyser.fftSize = 256;
          remoteSource.connect(rAnalyser);
          setRemoteAnalyser(rAnalyser);
        } catch {
          // createMediaStreamSource can throw if called twice for a stream;
          // safe to ignore — orb falls back to speaker-driven animation.
        }
      };

      // 6. Data channel — the source of ALL UI state.
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.addEventListener("open", () => setStatus("live"));
      dc.addEventListener("message", (e) => {
        try {
          handleServerEvent(JSON.parse(e.data));
        } catch {
          /* ignore malformed frames */
        }
      });

      // 7. SDP offer -> OpenAI -> answer.
      const offer = await pc.createOffer();
      if (pcRef.current !== pc) return; // torn down mid-flight
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(REALTIME_CALLS_URL, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });
      if (pcRef.current !== pc) return; // torn down mid-flight

      if (!sdpRes.ok) {
        throw new Error(`Realtime handshake failed (${sdpRes.status}).`);
      }
      const answer = { type: "answer" as const, sdp: await sdpRes.text() };
      await pc.setRemoteDescription(answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session.");
      setStatus("error");
      teardown();
    }
  }, [handleServerEvent, startMock, teardown]);

  // Mute = disable the track. Do NOT stop the track or re-acquire the mic —
  // stopping it confuses server-side VAD and the model talks into dead air.
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      // Still reflect intent in mock mode (no real stream to toggle).
      setIsMuted((m) => !m);
      return;
    }
    setIsMuted((m) => {
      const next = !m;
      stream.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, []);

  // Expose the completed transcript so a caller can hand it off later (Phase 4).
  // We do NOT build the POST / report navigation here — just return the data.
  const endCall = useCallback((): TranscriptEntry[] => {
    teardown();
    setStatus("ended");
    setSpeaker("silent");
    return transcript;
  }, [teardown, transcript]);

  // Cleanup on unmount — fully tears down the connection so StrictMode's
  // mount -> unmount -> remount cannot leave two peer connections open.
  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  return {
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
  };
}
