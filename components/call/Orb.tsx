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

// Layered radial gradients fake a soft, 3D, cloudy blob: a light highlight
// top-left, a saturated core, and a deep base — matching the reference orb.
// Buyer = cobalt blue (the reference); user = cyan/teal so you can tell who's
// speaking; silent = a calm, desaturated slate-blue.
const FILL: Record<Speaker, string> = {
  buyer:
    "radial-gradient(42% 40% at 34% 28%, #dbeafe 0%, rgba(219,234,254,0) 62%)," +
    "radial-gradient(55% 55% at 66% 72%, #1d4ed8 0%, rgba(29,78,216,0) 74%)," +
    "radial-gradient(90% 90% at 50% 52%, #2563eb 0%, #1e3a8a 100%)",
  user:
    "radial-gradient(42% 40% at 34% 28%, #cffafe 0%, rgba(207,250,254,0) 62%)," +
    "radial-gradient(55% 55% at 66% 72%, #0891b2 0%, rgba(8,145,178,0) 74%)," +
    "radial-gradient(90% 90% at 50% 52%, #06b6d4 0%, #0e7490 100%)",
  silent:
    "radial-gradient(42% 40% at 34% 28%, #e2e8f0 0%, rgba(226,232,240,0) 62%)," +
    "radial-gradient(55% 55% at 66% 72%, #64748b 0%, rgba(100,116,139,0) 74%)," +
    "radial-gradient(90% 90% at 50% 52%, #64748b 0%, #334155 100%)",
};

const GLOW: Record<Speaker, string> = {
  buyer: "#2563eb",
  user: "#06b6d4",
  silent: "#64748b",
};

export function Orb({ speaker, status, localAnalyser, remoteAnalyser }: Props) {
  const shapeRef = useRef<HTMLDivElement | null>(null); // scales with volume
  const glowRef = useRef<HTMLDivElement | null>(null); // blurred halo behind

  // Amplitude read in a rAF loop, written straight to the DOM — never React
  // state (60 updates/sec through React would kill the page).
  useEffect(() => {
    let raf = 0;
    let current = 1; // smoothed scale, eased toward target each frame
    const buf = new Uint8Array(128);

    const rms = (analyser: AnalyserNode | null): number => {
      if (!analyser) return 0;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      return Math.sqrt(sum / buf.length);
    };

    const tick = () => {
      const shape = shapeRef.current;
      const glow = glowRef.current;
      if (shape) {
        const active =
          speaker === "user"
            ? localAnalyser
            : speaker === "buyer"
            ? remoteAnalyser
            : null;

        let target = 1;
        if (active) {
          target = 1 + Math.min(rms(active) * 2.4, 0.55);
        } else if (speaker !== "silent") {
          const t = performance.now() / 200; // mock/no-analyser: synthetic sine
          target = 1 + (Math.sin(t) * 0.5 + 0.5) * 0.32;
        } else {
          const t = performance.now() / (status === "connecting" ? 380 : 900);
          target = 1 + (Math.sin(t) * 0.5 + 0.5) * 0.06; // idle breathing
        }

        current += (target - current) * 0.18; // ease → fluid swell
        shape.style.scale = current.toFixed(3);
        if (glow) {
          glow.style.scale = (1 + (current - 1) * 1.9).toFixed(3);
          glow.style.opacity = Math.min(0.4 + (current - 1) * 1.5, 0.95).toFixed(3);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaker, status, localAnalyser, remoteAnalyser]);

  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      {/* Blurred halo — sells the soft, glowing, out-of-focus look on dark bg */}
      <div
        ref={glowRef}
        aria-hidden
        className="absolute h-52 w-52 rounded-full blur-3xl transition-colors duration-700 will-change-transform"
        style={{ background: GLOW[speaker], opacity: 0.4 }}
      />

      {/* The morphing blob: layered radial gradients for the 3D look, with
          a slowly drifting border-radius that reads as molten folds. */}
      <div
        ref={shapeRef}
        className="relative h-48 w-48 animate-blob-morph transition-[background] duration-700 will-change-transform"
        style={{
          background: FILL[speaker],
          borderRadius: "46% 54% 57% 43% / 48% 44% 56% 52%",
        }}
      />
    </div>
  );
}
