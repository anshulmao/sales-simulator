import type { SessionConfig } from "./types";

// Hands a SessionConfig from the Phase 2 setup screen to the Phase 3 call
// screen across a client-side navigation. sessionStorage (not a store/context)
// so it survives the route change without a backend. When persistence lands
// (teammate A), this is the seam that gets replaced by a real session record.
const KEY = "salescoach:sessionConfig";

export function saveSessionConfig(config: SessionConfig): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(config));
  } catch {
    /* sessionStorage unavailable (SSR/private mode) — caller falls back */
  }
}

export function loadSessionConfig(): SessionConfig | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionConfig) : null;
  } catch {
    return null;
  }
}
