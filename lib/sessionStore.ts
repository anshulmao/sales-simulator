import type { SessionConfig, TranscriptEntry, Report } from "./types";

// Client-side seam to the persistence API. The config handoff (setup -> call) is
// an in-flight, client-only value and stays SYNCHRONOUS via sessionStorage. The
// finished-session functions (save/load/list) are DB-backed and therefore ASYNC
// — see the ⚠️ notes below; callers must await them.
//
// A localStorage fallback keeps the call -> report flow working locally before
// Neon is provisioned (or if the DB is briefly unreachable). Fallback records are
// transcript-only — they are never scored, since scoring runs server-side.

const CONFIG_KEY = "salescoach:sessionConfig";
const LAST_ID_KEY = "salescoach:lastSessionId";
const LOCAL_PREFIX = "salescoach:session:"; // one entry per fallback record

// --- Phase 2 -> 3: the config that starts a call (sync, client-only) ---
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

// --- Phase 3 -> 4: the finished call, persisted + scored ---
export type StoredSession = {
  id?: string; // assigned on save
  config: SessionConfig;
  transcript: TranscriptEntry[];
  endedAt: number;
  durationMs: number;
  report?: Report; // filled by save-time scoring (server-side)
};

// Lightweight row for the history/progress screen (mirrors lib/db SessionSummary).
export type SessionSummary = {
  id: string;
  endedAt: number;
  durationMs: number;
  role: string;
  resistance: string;
  salesStage: string;
  overallScore: number | null;
};

// ⚠️ ASYNC — callers must `await`. Persists the finished call server-side (which
// also SCORES it at save time) and returns the new session id to navigate with.
// On DB failure it falls back to a local-only record so the report still opens.
export async function saveSession(session: StoredSession): Promise<string> {
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: session.config,
        transcript: session.transcript,
        endedAt: session.endedAt,
        durationMs: session.durationMs,
      }),
    });
    if (res.ok) {
      const { id, report } = (await res.json()) as {
        id: string;
        report?: Report;
      };
      stashLocal({ ...session, id, report: report ?? session.report });
      setLastId(id);
      return id;
    }
    // 503 (no DB) or any error -> local fallback below.
  } catch {
    /* network error -> local fallback below */
  }

  const id = `local-${uuid()}`;
  stashLocal({ ...session, id });
  setLastId(id);
  return id;
}

// ⚠️ ASYNC — callers must `await`. Loads a stored session by id, or the last one
// saved if no id is given. Tries the DB, then the local fallback copy.
export async function loadSession(id?: string): Promise<StoredSession | null> {
  const sid = id ?? getLastId();
  if (!sid) return null;

  if (!sid.startsWith("local-")) {
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(sid)}`);
      if (res.ok) return (await res.json()) as StoredSession;
    } catch {
      /* fall through to local */
    }
  }
  return readLocal(sid);
}

// ⚠️ ASYNC — callers must `await`. Lists past sessions for the history/progress
// screen. DB first, then whatever local fallback records exist.
export async function loadSessions(): Promise<SessionSummary[]> {
  try {
    const res = await fetch("/api/sessions");
    if (res.ok) return (await res.json()) as SessionSummary[];
  } catch {
    /* fall through to local */
  }
  return readLocalSummaries();
}

// --- local fallback helpers (localStorage so records survive tab close) ---

function setLastId(id: string): void {
  try {
    localStorage.setItem(LAST_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

function getLastId(): string | null {
  try {
    return localStorage.getItem(LAST_ID_KEY);
  } catch {
    return null;
  }
}

function stashLocal(session: StoredSession): void {
  if (!session.id) return;
  try {
    localStorage.setItem(LOCAL_PREFIX + session.id, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

function readLocal(id: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + id);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function readLocalSummaries(): SessionSummary[] {
  try {
    const out: SessionSummary[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(LOCAL_PREFIX)) continue;
      const s = JSON.parse(localStorage.getItem(key) as string) as StoredSession;
      out.push({
        id: s.id ?? key.slice(LOCAL_PREFIX.length),
        endedAt: s.endedAt,
        durationMs: s.durationMs,
        role: s.config?.persona?.role ?? "Unknown",
        resistance: s.config?.persona?.resistance ?? "",
        salesStage: s.config?.scenario?.salesStage ?? "",
        overallScore: s.report?.overallScore ?? null,
      });
    }
    return out.sort((a, b) => b.endedAt - a.endedAt);
  } catch {
    return [];
  }
}

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}
