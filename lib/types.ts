// Shared data contracts — LOCKED across frontend / backend / AI layer.
// Do not change these shapes without coordinating; other people build against them.

// Produced by Phase 2 (setup), consumed by the session token route.
// This session hardcodes an instance in lib/buyerPersona.ts.
export type SessionConfig = {
  persona: {
    role: string;
    industry: string;
    behaviour: string;
    resistance: "low" | "medium" | "high";
  };
  scenario: { salesStage: string; repGoal: string };
  voice: string;
};

// Produced by the call screen, consumed by Phase 4 scoring.
// The single most important contract in the product — clean structured data,
// NOT strings formatted for display. Rendering is the component's job.
export type TranscriptEntry = {
  role: "user" | "buyer";
  text: string;
  id: string;
  timestamp: number;
};
