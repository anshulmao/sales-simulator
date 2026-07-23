import type { SessionConfig, TranscriptEntry, Report } from "./types";

// Hands data between screens across a client-side navigation without a backend.
// sessionStorage (not a store/context) so it survives the route change. These
// two functions are the seams that get replaced by real session records when
// persistence lands (teammate A).
const CONFIG_KEY = "salescoach:sessionConfig";
const RESULT_KEY = "salescoach:lastSession";

// --- Phase 2 -> 3: the config that starts a call ---
export function saveSessionConfig(config: SessionConfig): void {
  try {
    sessionStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* sessionStorage unavailable (SSR/private mode) — caller falls back */
  }
}

export function loadSessionConfig(): SessionConfig | null {
  try {
    const raw = sessionStorage.getItem(CONFIG_KEY);
    return raw ? (JSON.parse(raw) as SessionConfig) : null;
  } catch {
    return null;
  }
}

// --- Phase 3 -> 4: the finished call handed to the report ---
// `report` is intentionally optional: the transcript is produced here (frontend),
// the scored Report is produced later by the evaluation model (teammate B).
export type StoredSession = {
  config: SessionConfig;
  transcript: TranscriptEntry[];
  endedAt: number;
  durationMs: number;
  report?: Report;
};

export function saveSession(session: StoredSession): void {
  try {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}
