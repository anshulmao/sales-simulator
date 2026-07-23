// Small presentation helpers shared by the dashboard, history and progress
// screens. Pure formatting — no data fetching.

export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Compact duration for list rows: "8 min" (min 1).
export function fmtDuration(ms: number): string {
  return `${Math.max(1, Math.round(ms / 60000))} min`;
}

// Relative day + time: "Today, 11:20", "Yesterday, 16:05", "Mon, 09:30",
// then falls back to "12 Jul" for older sessions.
export function relDay(ts: number): string {
  const d = new Date(ts);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days <= 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  if (days < 7) return `${d.toLocaleDateString([], { weekday: "short" })}, ${time}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Score → traffic-light colour (null = not yet scored).
export function scoreColor(s: number | null): string {
  if (s == null) return "#8A90A0";
  if (s >= 8) return "#22C55E";
  if (s >= 7) return "#F59E0B";
  return "#EF4444";
}

// Deterministic avatar gradient from a stable key (session id), so the same
// session always gets the same tile colour without storing one.
const GRADS = [
  "linear-gradient(135deg,#2563EB,#1E3A8A)",
  "linear-gradient(135deg,#06B6D4,#0E7490)",
  "linear-gradient(135deg,#7C5CFF,#4C1D95)",
];
export function gradFor(key: string): string {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADS[h % GRADS.length];
}
