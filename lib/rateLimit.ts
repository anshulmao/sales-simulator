// Deliberately NOT security. An in-memory guard so a stuck retry loop in another
// lane's code cannot silently burn OpenAI credits while nobody is watching. Resets
// on server restart and does not span serverless instances — fine for its purpose.

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SESSIONS_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

export function checkRateLimit(ip: string): {
  ok: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_SESSIONS_PER_WINDOW) {
    const oldest = recent[0];
    hits.set(ip, recent); // keep the pruned window
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((WINDOW_MS - (now - oldest)) / 1000),
    };
  }

  recent.push(now);
  hits.set(ip, recent);
  return { ok: true };
}
