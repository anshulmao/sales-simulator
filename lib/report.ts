import type { Report } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

// Stored JSON predates the current Report contract in some environments. Treat
// those legacy payloads as unscored so they can be regenerated instead of
// crashing the report screen with missing fields.
export function isCurrentReport(value: unknown): value is Report {
  if (!isRecord(value) || !isRecord(value.scenario)) {
    return false;
  }
  // voice is optional (no audio pipeline yet) — but if present it must be
  // fully-formed. Legacy reports carrying the old -1 sentinel voice still pass
  // here shape-wise but fail on the missing scenario.closing, which is what
  // routes them to re-scoring.
  if (value.voice !== undefined) {
    if (
      !isRecord(value.voice) ||
      typeof value.voice.clarity !== "number" ||
      typeof value.voice.pace !== "number" ||
      typeof value.voice.tone !== "number"
    ) {
      return false;
    }
  }
  return (
    typeof value.overall === "number" &&
    typeof value.headline === "string" &&
    typeof value.summary === "string" &&
    typeof value.scenario.opening === "number" &&
    typeof value.scenario.discovery === "number" &&
    typeof value.scenario.o === "number" &&
    typeof value.scenario.closing === "number" &&
    Array.isArray(value.keyMoments) &&
    Array.isArray(value.strengths) &&
    Array.isArray(value.improvements) &&
    typeof value.nextStep === "string"
  );
}
