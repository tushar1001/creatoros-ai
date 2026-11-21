import type { ZodType } from "zod";

/**
 * Server-side LLM helper.
 *
 * Provider chain (first one that works wins, retried per attempt):
 *  1. Gemini (primary)  - via generativelanguage.googleapis.com, JSON mode via
 *                         responseMimeType. Model: GEMINI_MODEL
 *                         (default: gemini-3.8-flash).
 *  2. Groq (fallback)   - OpenAI-compatible endpoint, JSON mode.
 *                         Model: GROQ_MODEL (default: llama-3.3-70b-versatile).
 *
 * Resilience:
 * - Per-provider circuit breakers: hard auth/geo failures (401/403, Gemini
 *   "location not supported") open a 5-minute breaker so healthy providers
 *   are reached without latency penalties.
 * - Robust JSON extraction + repair.
 * - Zod validation with retry on invalid output.
 * - Timeout handling and friendly errors.
 */

export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIError";
  }
}

export function extractJson(raw: string): unknown {
  let t = raw.trim();
  // Strip markdown code fences if the model added them.
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in AI response");
  }
  let slice = t.slice(first, last + 1);
  // Repair common issues: trailing commas before } or ]
  slice = slice.replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(slice);
}

// ---------------------------------------------------------------------------
// Shared circuit breaker state
// ---------------------------------------------------------------------------

const CIRCUIT_BREAK_MS = 5 * 60_000;
const breakerDownUntil: Record<string, number> = {
  gemini: 0,
  groq: 0,
};

function isBroken(provider: string): boolean {
  return Date.now() < (breakerDownUntil[provider] ?? 0);
}

function tripBreaker(provider: string, reason: string): void {
  breakerDownUntil[provider] = Date.now() + CIRCUIT_BREAK_MS;
  console.warn(
    `[LLM] ${provider} circuit breaker opened for ${CIRCUIT_BREAK_MS / 1000}s (${reason})`,
  );
}

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    dispose: () => clearTimeout(timer),
  };
}

function friendlyAbort(err: unknown): never {
  if (err instanceof DOMException && err.name === "AbortError") {
    throw new Error("The AI took too long to respond");
  }
  throw err as Error;
}

// ---------------------------------------------------------------------------
// Provider 1: Gemini (primary)
// ---------------------------------------------------------------------------

const GEMINI_DEFAULT_MODEL = "gemini-3.8-flash";

function geminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || GEMINI_DEFAULT_MODEL;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { code?: number; message?: string; status?: string };
}

async function callGemini(
  system: string,
  user: string,
  timeoutMs: number,
  attemptHint: string,
): Promise<string> {
  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  if (isBroken("gemini")) throw new Error("Gemini temporarily unavailable (circuit breaker open)");

  const { signal, dispose } = withTimeoutSignal(timeoutMs);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel())}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `${system}${attemptHint}\n\nYou must respond with ONLY a single valid JSON object. No markdown fences, no commentary.`,
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
      signal,
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) {
        tripBreaker("gemini", `auth rejected HTTP ${res.status}`);
        throw new Error(`Gemini rejected the request (HTTP ${res.status})`);
      }
      if (
        res.status === 400 &&
        bodyText.toLowerCase().includes("location is not supported")
      ) {
        tripBreaker("gemini", "region geo-blocked");
        throw new Error("Gemini unavailable in this region");
      }
      throw new Error(
        `Gemini HTTP ${res.status}${bodyText ? `: ${bodyText.slice(0, 140)}` : ""}`,
      );
    }

    const data = (await res.json()) as GeminiResponse;
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const content = parts.map((p) => p.text ?? "").join("").trim();
    if (!content) {
      throw new Error("Empty response from Gemini");
    }
    return content;
  } catch (err) {
    friendlyAbort(err);
  } finally {
    dispose();
  }
}

// ---------------------------------------------------------------------------
// Provider 2: Groq (fallback)
// ---------------------------------------------------------------------------

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

function groqApiKey(): string | null {
  return process.env.GROQ_API_KEY?.trim() || null;
}

function groqModel(): string {
  return process.env.GROQ_MODEL?.trim() || GROQ_DEFAULT_MODEL;
}

interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

async function callGroq(
  system: string,
  user: string,
  timeoutMs: number,
  attemptHint: string,
): Promise<string> {
  const apiKey = groqApiKey();
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");
  if (isBroken("groq")) throw new Error("Groq temporarily unavailable (circuit breaker open)");

  const { signal, dispose } = withTimeoutSignal(timeoutMs);
  try {
    // Groq JSON mode requires the word "JSON" in the context - be explicit.
    const sys = `${system}${attemptHint}\n\nYou must respond with ONLY a single valid JSON object (JSON mode). No markdown fences, no commentary.`;

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: groqModel(),
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 8192,
      }),
      signal,
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) {
        // Invalid key OR geo/network block (Groq returns 403 for blocked regions).
        tripBreaker("groq", `rejected HTTP ${res.status}`);
        throw new Error(`Groq rejected the request (HTTP ${res.status})`);
      }
      throw new Error(
        `Groq HTTP ${res.status}${bodyText ? `: ${bodyText.slice(0, 140)}` : ""}`,
      );
    }

    const data = (await res.json()) as GroqChatResponse;
    const content = data?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new Error("Empty response from Groq");
    }
    return content;
  } catch (err) {
    friendlyAbort(err);
  } finally {
    dispose();
  }
}

// ---------------------------------------------------------------------------
// Public API - provider-agnostic structured generation
// ---------------------------------------------------------------------------

interface GenerateOptions<T> {
  system: string;
  user: string;
  schema: ZodType<T>;
  timeoutMs?: number;
  maxAttempts?: number;
}

const RETRY_HINT =
  "\n\nCRITICAL: your previous response could not be parsed as valid JSON matching the schema. Respond with ONLY a single, valid, complete JSON object. No markdown fences, no commentary.";

function providerChain(): Array<"gemini" | "groq"> {
  const chain: Array<"gemini" | "groq"> = [];
  if (geminiApiKey()) chain.push("gemini");
  if (groqApiKey()) chain.push("groq");
  return chain;
}

export async function generateJSON<T>(opts: GenerateOptions<T>): Promise<T> {
  const { system, user, schema, timeoutMs = 120_000, maxAttempts = 3 } = opts;
  const chain = providerChain();
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptHint = attempt === 1 ? "" : RETRY_HINT;

    try {
      if (chain.length === 0) {
        throw new AIError(
          "No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY in your .env file.",
        );
      }

      let raw = "";
      let servedBy: "gemini" | "groq" | null = null;

      for (const provider of chain) {
        try {
          raw =
            provider === "gemini"
              ? await callGemini(system, user, timeoutMs, attemptHint)
              : await callGroq(system, user, timeoutMs, attemptHint);
          servedBy = provider;
          break;
        } catch (providerErr) {
          console.warn(
            `[LLM] ${provider} attempt ${attempt} failed (${providerErr instanceof Error ? providerErr.message : providerErr}) - trying next provider`,
          );
        }
      }

      if (!servedBy) {
        throw new Error("All LLM providers failed for this attempt");
      }

      const parsed = extractJson(raw);
      const result = schema.safeParse(parsed);
      if (!result.success) {
        const issues = result.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
          .join("; ");
        throw new Error(`AI returned an invalid structure (${issues})`);
      }

      console.log(
        `[LLM] served by ${servedBy} (model: ${servedBy === "gemini" ? geminiModel() : groqModel()}, attempt ${attempt})`,
      );
      return result.data;
    } catch (err) {
      if (err instanceof AIError) throw err;
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 900 * attempt));
      }
    }
  }

  const msg =
    lastErr instanceof Error
      ? lastErr.message === "The AI took too long to respond"
        ? "Generation is taking unusually long. Please try again."
        : `We couldn't generate this right now (${lastErr.message}). Your work is saved - please retry.`
      : "We couldn't generate this right now. Please retry.";
  throw new AIError(msg);
}
