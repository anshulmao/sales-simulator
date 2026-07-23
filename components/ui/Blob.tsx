"use client";

// Static presentational orb for mockup screens (hero, previews). The live,
// audio-reactive orb lives in components/call/Orb.tsx. Shares the same visual
// language: layered radial gradients + morphing shape + cobalt glow.
type Props = {
  size?: number;
  glow?: number; // px blur radius of the halo
  className?: string;
};

export function Blob({ size = 160, glow = 90, className = "" }: Props) {
  return (
    <div
      className={`animate-blob-morph shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "47% 53% 55% 45% / 52% 46% 54% 48%",
        backgroundImage:
          "radial-gradient(42% 40% at 34% 28%, #DBEAFE 0%, rgba(219,234,254,0) 62%), radial-gradient(90% 90% at 50% 52%, #2563EB 0%, #1E3A8A 100%)",
        boxShadow: `0 0 ${glow}px ${Math.round(glow / 7)}px rgba(37,99,235,0.5)`,
      }}
    />
  );
}
