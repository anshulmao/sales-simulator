const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 90;

const hits = new Map<string, number[]>();

export function checkCoachRateLimit(ip: string): {
  ok: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = recent[0];
    hits.set(ip, recent);
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((WINDOW_MS - (now - oldest)) / 1000),
    };
  }

  recent.push(now);
  hits.set(ip, recent);
  return { ok: true };
}
