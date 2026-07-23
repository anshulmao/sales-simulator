"use client";

import { useEffect, useState } from "react";
import { loadSessions, type SessionSummary } from "@/lib/sessionStore";

// Loads the past-session list once on mount. `sessions === null` means still
// loading; a resolved value (possibly []) means done. Backed by loadSessions()
// which falls back to local records when the DB is unavailable.
export function useSessions() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    let active = true;
    loadSessions()
      .then((s) => active && setSessions(s))
      .catch(() => active && setSessions([]));
    return () => {
      active = false;
    };
  }, []);

  return { sessions, loading: sessions === null };
}
