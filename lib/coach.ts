import type { SessionConfig, TranscriptEntry } from "./types";

export const MAX_COACH_TRANSCRIPT_ENTRIES = 10;
export const MAX_COACH_TRANSCRIPT_TEXT = 600;
export const MAX_COACH_SUGGESTION_LENGTH = 180;

export type CoachRequest = {
  config: SessionConfig;
  transcript: TranscriptEntry[];
};

export const COACH_INSTRUCTIONS = [
  "You are a discreet live sales-call teleprompter.",
  "Return exactly one concise sentence that the sales rep can say next, verbatim.",
  "Write natural spoken language, not advice, analysis, a label, or a list.",
  "Respond to the buyer's latest concern while advancing the rep's stated goal.",
  "Prefer a thoughtful question over a pitch when the conversation still needs discovery.",
  "Never invent product capabilities, pricing, proof, customer names, results, or commitments.",
  "Do not repeat wording the rep has already used.",
  `Keep the entire response under ${MAX_COACH_SUGGESTION_LENGTH} characters.`,
].join(" ");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function optionalBoundedString(
  value: unknown,
  maxLength: number
): string | undefined {
  return boundedString(value, maxLength) ?? undefined;
}

function parseSessionConfig(value: unknown): SessionConfig | null {
  if (!isRecord(value) || !isRecord(value.persona) || !isRecord(value.scenario)) {
    return null;
  }

  const role = boundedString(value.persona.role, 120);
  const industry = boundedString(value.persona.industry, 120);
  const behaviour = boundedString(value.persona.behaviour, 300);
  const resistance = value.persona.resistance;
  const salesStage = boundedString(value.scenario.salesStage, 120);
  const repGoal = boundedString(value.scenario.repGoal, 300);
  const voice = boundedString(value.voice, 80);
  const engagementHistory = optionalBoundedString(
    value.persona.engagementHistory,
    500
  );
  const environment = optionalBoundedString(value.scenario.environment, 120);
  const salesExperience = isRecord(value.seller)
    ? optionalBoundedString(value.seller.salesExperience, 120)
    : undefined;
  const product = isRecord(value.company)
    ? optionalBoundedString(value.company.product, 300)
    : undefined;
  const brand = isRecord(value.company)
    ? optionalBoundedString(value.company.brand, 120)
    : undefined;
  const marketPositioning = isRecord(value.company)
    ? optionalBoundedString(value.company.marketPositioning, 300)
    : undefined;
  const salesPlaybook = isRecord(value.company)
    ? optionalBoundedString(value.company.salesPlaybook, 800)
    : undefined;
  const sessionType =
    value.sessionType === "one-off" || value.sessionType === "pipeline"
      ? value.sessionType
      : undefined;

  if (
    !role ||
    !industry ||
    !behaviour ||
    !salesStage ||
    !repGoal ||
    !voice ||
    (resistance !== "low" && resistance !== "medium" && resistance !== "high")
  ) {
    return null;
  }

  return {
    persona: {
      role,
      industry,
      behaviour,
      resistance,
      ...(engagementHistory ? { engagementHistory } : {}),
    },
    scenario: {
      salesStage,
      repGoal,
      ...(environment ? { environment } : {}),
    },
    ...(salesExperience ? { seller: { salesExperience } } : {}),
    ...(product || brand || marketPositioning || salesPlaybook
      ? {
          company: {
            ...(product ? { product } : {}),
            ...(brand ? { brand } : {}),
            ...(marketPositioning ? { marketPositioning } : {}),
            ...(salesPlaybook ? { salesPlaybook } : {}),
          },
        }
      : {}),
    ...(sessionType ? { sessionType } : {}),
    voice,
  };
}

function parseTranscript(value: unknown): TranscriptEntry[] | null {
  if (!Array.isArray(value)) return null;

  const recent = value.slice(-MAX_COACH_TRANSCRIPT_ENTRIES);
  const parsed: TranscriptEntry[] = [];

  for (const entry of recent) {
    if (!isRecord(entry) || (entry.role !== "user" && entry.role !== "buyer")) {
      return null;
    }

    const text = boundedString(entry.text, MAX_COACH_TRANSCRIPT_TEXT);
    const id = boundedString(entry.id, 160);
    if (!text || !id) return null;

    parsed.push({
      role: entry.role,
      text,
      id,
      timestamp:
        typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp)
          ? entry.timestamp
          : 0,
    });
  }

  return parsed;
}

export function parseCoachRequest(value: unknown): CoachRequest | null {
  if (!isRecord(value)) return null;
  const config = parseSessionConfig(value.config);
  const transcript = parseTranscript(value.transcript);
  if (!config || !transcript) return null;
  return { config, transcript };
}

export function buildCoachInput({
  config,
  transcript,
}: CoachRequest): string {
  const context = [
    `Buyer: ${config.persona.role} in ${config.persona.industry}`,
    `Buyer behaviour: ${config.persona.behaviour}`,
    `Resistance: ${config.persona.resistance}`,
    `Sales stage: ${config.scenario.salesStage}`,
    `Rep goal: ${config.scenario.repGoal}`,
  ];

  if (config.scenario.environment) {
    context.push(`Call environment: ${config.scenario.environment}`);
  }
  if (config.persona.engagementHistory) {
    context.push(`Prior engagement: ${config.persona.engagementHistory}`);
  }
  if (config.seller?.salesExperience) {
    context.push(`Rep experience: ${config.seller.salesExperience}`);
  }
  if (config.company?.product) {
    context.push(`Product: ${config.company.product}`);
  }
  if (config.company?.brand) {
    context.push(`Brand: ${config.company.brand}`);
  }
  if (config.company?.marketPositioning) {
    context.push(`Market positioning: ${config.company.marketPositioning}`);
  }
  if (config.company?.salesPlaybook) {
    context.push(`Sales playbook: ${config.company.salesPlaybook}`);
  }

  if (transcript.length === 0) {
    return [
      ...context,
      "",
      "The call has just started and there is no transcript yet.",
      "Give the rep an opening line that fits this stage and goal.",
    ].join("\n");
  }

  const turns = transcript.map(
    (entry) => `${entry.role === "user" ? "Rep" : "Buyer"}: ${entry.text}`
  );

  return [
    ...context,
    "",
    "Recent conversation:",
    ...turns,
    "",
    "Give the rep the single best sentence to say next.",
  ].join("\n");
}

export function extractResponseText(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.output_text === "string") return value.output_text;
  if (!Array.isArray(value.output)) return null;

  for (const outputItem of value.output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) continue;
    for (const contentItem of outputItem.content) {
      if (
        isRecord(contentItem) &&
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        return contentItem.text;
      }
    }
  }

  return null;
}

export function normalizeSuggestion(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const suggestion = value
    .trim()
    .replace(/^["“”']+|["“”']+$/g, "")
    .replace(/\s+/g, " ");

  if (
    !suggestion ||
    suggestion.length > MAX_COACH_SUGGESTION_LENGTH ||
    /^(try saying|say|suggestion|next line)\s*:/i.test(suggestion)
  ) {
    return null;
  }

  const sentenceEndings = suggestion.match(/[.!?](?=\s|$)/g) ?? [];
  if (sentenceEndings.length > 1) return null;

  return suggestion;
}
