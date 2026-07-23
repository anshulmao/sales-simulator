"use client";

import { useEffect, useRef } from "react";

type Speaker = "user" | "buyer" | "silent";
type Status = "idle" | "connecting" | "live" | "ended" | "error";

type Props = {
  speaker: Speaker;
  status: Status;
  localAnalyser: AnalyserNode | null;
  remoteAnalyser: AnalyserNode | null;
};

// Colour per speaker. Kept as full class strings so Tailwind keeps them.
const GLOW: Record<Speaker, string> = {
  user: "from-emerald-400 to-emerald-600 shadow-[0_0_80px_20px_rgba(52,211,153,0.55)]",
  buyer: "from-indigo-400 to-violet-600 shadow-[0_0_80px_20px_rgba(129,140,248,0.55)]",
  silent: "from-slate-500 to-slate-700 shadow-[0_0_50px_10px_rgba(100,116,139,0.35)]",
};

export function Orb({ speaker, status, localAnalyser, remoteAnalyser }: Props) {
  const orbRef = useRef<HTMLDivElement | null>(null);

  // Amplitude is read in a rAF loop and written straight to the DOM node.
  // It is NEVER React state — 60 updates/sec through React would kill the page.
  useEffect(() => {
    let raf = 0;
    const buf = new Uint8Array(128);

    const read = (analyser: AnalyserNode | null): number => {
      if (!analyser) return 0;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128; // -1..1
        sum += v * v;
      }
      return Math.sqrt(sum / buf.length); // RMS 0..~1
    };

    const tick = () => {
      const el = orbRef.current;
      if (el) {
        let scale = 1;
        const active =
          speaker === "user"
            ? localAnalyser
            : speaker === "buyer"
            ? remoteAnalyser
            : null;

        if (active) {
          scale = 1 + Math.min(read(active) * 2.2, 0.5);
        } else if (speaker !== "silent") {
          // Mock mode / no analyser but someone is "speaking": synthetic sine.
          const t = performance.now() / 220;
          scale = 1 + (Math.sin(t) * 0.5 + 0.5) * 0.28;
        } else if (status === "connecting") {
          const t = performance.now() / 400;
          scale = 1 + (Math.sin(t) * 0.5 + 0.5) * 0.1;
        }
        el.style.transform = `scale(${scale.toFixed(3)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaker, status, localAnalyser, remoteAnalyser]);

  const idle = speaker === "silent" && status !== "connecting";

  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      <div
        ref={orbRef}
        className={`h-40 w-40 rounded-full bg-gradient-to-br transition-colors duration-500 will-change-transform ${
          GLOW[speaker]
        } ${idle ? "animate-ambient-pulse" : ""}`}
        style={{ transform: "scale(1)" }}
      />
    </div>
  );
}
