import type { Report } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

// Stored JSON predates the current Report contract in some environments. Treat
// those legacy payloads as unscored so they can be regenerated instead of
// crashing the report screen with missing fields.
export function isCurrentReport(value: unknown): value is Report {
  if (!isRecord(value) || !isRecord(value.voice) || !isRecord(value.scenario)) {
    return false;
  }
  return (
    typeof value.overall === "number" &&
    typeof value.headline === "string" &&
    typeof value.summary === "string" &&
    typeof value.voice.clarity === "number" &&
    typeof value.voice.pace === "number" &&
    typeof value.voice.tone === "number" &&
    typeof value.scenario.opening === "number" &&
    typeof value.scenario.discovery === "number" &&
    typeof value.scenario.o === "number" &&
    Array.isArray(value.keyMoments) &&
    Array.isArray(value.strengths) &&
    Array.isArray(value.improvements) &&
    typeof value.nextStep === "string"
  );
}
