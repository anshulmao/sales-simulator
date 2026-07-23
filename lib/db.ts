import { neon } from "@neondatabase/serverless";
import type { SessionConfig, TranscriptEntry, Report } from "./types";
import { isCurrentReport } from "./report";

// Server-only. Talks to Neon (Vercel Postgres) over HTTP. The connection string
// comes from the environment — Vercel's Neon integration provides DATABASE_URL
// (and POSTGRES_URL); we accept either. NEVER import this from a client module.

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

// True once the DB is provisioned + the env var is set. Routes check this and
// return 503 (instead of crashing) so the app still runs locally before Neon
// exists — the client then falls back to its local-only store.
export function isConfigured(): boolean {
  return connectionString.length > 0;
}

// Lazily created so importing this module never throws when the DB isn't set up.
const sql = connectionString ? neon(connectionString) : null;

// A full stored session as it comes back from the DB.
export type SessionRow = {
  id: string;
  config: SessionConfig;
  transcript: TranscriptEntry[];
  report: Report | null;
  endedAt: number;
  durationMs: number;
  createdAt: string;
};

// The lightweight shape the history/progress list needs — no transcript payload.
export type SessionSummary = {
  id: string;
  endedAt: number;
  durationMs: number;
  role: string;
  resistance: string;
  salesStage: string;
  overallScore: number | null;
};

// CREATE TABLE IF NOT EXISTS, run at most once per cold start (memoised promise).
let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!sql) throw new Error("Database is not configured.");
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id          TEXT PRIMARY KEY,
          config      JSONB NOT NULL,
          transcript  JSONB NOT NULL,
          report      JSONB,
          ended_at    BIGINT NOT NULL,
          duration_ms INTEGER NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  return schemaReady;
}

export async function insertSession(row: {
  id: string;
  config: SessionConfig;
  transcript: TranscriptEntry[];
  report: Report | null;
  endedAt: number;
  durationMs: number;
}): Promise<void> {
  if (!sql) throw new Error("Database is not configured.");
  await ensureSchema();
  // JSON.stringify + a jsonb column: Postgres parses the text into jsonb. Reads
  // come back already parsed into JS objects (pg/neon decode json + jsonb).
  await sql`
    INSERT INTO sessions (id, config, transcript, report, ended_at, duration_ms)
    VALUES (
      ${row.id},
      ${JSON.stringify(row.config)},
      ${JSON.stringify(row.transcript)},
      ${row.report ? JSON.stringify(row.report) : null},
      ${row.endedAt},
      ${row.durationMs}
    )
  `;
}

export async function getSession(id: string): Promise<SessionRow | null> {
  if (!sql) throw new Error("Database is not configured.");
  await ensureSchema();
  const rows = (await sql`
    SELECT id, config, transcript, report, ended_at, duration_ms, created_at
    FROM sessions WHERE id = ${id}
  `) as Record<string, unknown>[];
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id as string,
    config: r.config as SessionConfig,
    transcript: r.transcript as TranscriptEntry[],
    report: isCurrentReport(r.report) ? r.report : null,
    endedAt: Number(r.ended_at),
    durationMs: Number(r.duration_ms),
    createdAt: String(r.created_at),
  };
}

export async function updateSessionReport(
  id: string,
  report: Report
): Promise<void> {
  if (!sql) throw new Error("Database is not configured.");
  await ensureSchema();
  await sql`
    UPDATE sessions
    SET report = ${JSON.stringify(report)}
    WHERE id = ${id}
  `;
}

export async function listSessions(limit = 50): Promise<SessionSummary[]> {
  if (!sql) throw new Error("Database is not configured.");
  await ensureSchema();
  const rows = (await sql`
    SELECT id, config, report, ended_at, duration_ms
    FROM sessions ORDER BY created_at DESC LIMIT ${limit}
  `) as Record<string, unknown>[];
  return rows.map((r) => {
    const config = r.config as SessionConfig;
    const report = isCurrentReport(r.report) ? r.report : null;
    return {
      id: r.id as string,
      endedAt: Number(r.ended_at),
      durationMs: Number(r.duration_ms),
      role: config?.persona?.role ?? "Unknown",
      resistance: config?.persona?.resistance ?? "",
      salesStage: config?.scenario?.salesStage ?? "",
      overallScore: report?.overall ?? null,
    };
  });
}
