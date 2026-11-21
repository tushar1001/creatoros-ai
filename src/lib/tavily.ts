/**
 * Server-only Tavily web-search client.
 * Powers live competitor pricing research for the AI Product Lab.
 * The API key never leaves the server; results are cached in memory.
 */

const TAVILY_ENDPOINT = "https://api.tavily.com/search";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_MAX = 200;
const DEFAULT_TIMEOUT_MS = 15_000;

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  answer: string | null;
  results: TavilySearchResult[];
}

interface CacheEntry {
  data: TavilyResponse;
  ts: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(query: string, maxResults: number): string {
  return `${query.toLowerCase().trim()}::${maxResults}`;
}

function readCache(key: string): TavilyResponse | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function writeCache(key: string, data: TavilyResponse): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, { data, ts: Date.now() });
}

export class TavilyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TavilyError";
  }
}

export function isTavilyConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

export async function tavilySearch(
  query: string,
  opts: { maxResults?: number; timeoutMs?: number } = {},
): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new TavilyError("Pricing research is not configured");
  }

  const maxResults = Math.min(10, Math.max(1, opts.maxResults ?? 6));
  const key = cacheKey(query, maxResults);
  const cached = readCache(key);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new TavilyError(`Search provider returned ${res.status}`);
    }

    const json = (await res.json()) as {
      answer?: string | null;
      results?: Array<{ title?: string; url?: string; content?: string; score?: number }>;
    };

    const data: TavilyResponse = {
      answer: typeof json.answer === "string" ? json.answer : null,
      results: (json.results ?? [])
        .filter((r) => r.url && r.title)
        .slice(0, maxResults)
        .map((r) => ({
          title: r.title as string,
          url: r.url as string,
          content: (r.content ?? "").slice(0, 900),
          score: typeof r.score === "number" ? r.score : 0,
        })),
    };

    writeCache(key, data);
    return data;
  } catch (err) {
    if (err instanceof TavilyError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new TavilyError("Pricing search timed out");
    }
    throw new TavilyError(
      err instanceof Error ? `Pricing search failed: ${err.message}` : "Pricing search failed",
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Small delay helper used to stagger requests politely. */
export function pDelay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
