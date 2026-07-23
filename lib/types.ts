// Locked contracts. Other lanes build against these exact shapes — do not modify.

export type SessionConfig = {
  persona: {
    role: string;
    industry: string;
    behaviour: string;
    resistance: "low" | "medium" | "high";
  };
  scenario: {
    salesStage: string;
    repGoal: string;
  };
  voice: string;
};

// Produced by the FRONTEND from OpenAI Realtime events. It lives here only so the
// backend understands the downstream shape and never emits OpenAI's `assistant`
// vocabulary anywhere. The buyer's turns are labelled `buyer`, never `assistant`.
export type TranscriptEntry = {
  role: "user" | "buyer";
  text: string;
  id: string;
  timestamp: number;
};
