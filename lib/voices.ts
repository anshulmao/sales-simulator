// Friendly display label -> the OpenAI Realtime voice id set on the session.
// cedar and marin are the recommended-quality voices. Shared by setup (per-call
// choice) and settings (default choice) so the two lists cannot drift.
export const VOICE_OPTIONS: Record<string, string> = {
  Cedar: "cedar",
  Marin: "marin",
  Ash: "ash",
  Verse: "verse",
};
