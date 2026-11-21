import { NextResponse } from "next/server";
import { z } from "zod";
import { PRICING_SYSTEM, pricingResearchPrompt } from "@/lib/ai/prompts";
import { pricingIntelSchema } from "@/lib/ai/schemas";
import { generateJSON, AIError } from "@/lib/ai/llm";
import { tavilySearch, TavilyError, isTavilyConfigured, pDelay } from "@/lib/tavily";
import type { PricingIntel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const bodySchema = z.object({
  name: z.string().min(2).max(200),
  format: z.string().min(1).max(120),
  priceInr: z.coerce.number().min(0).max(1_000_000),
  niche: z.string().min(1).max(160),
  audienceSegments: z.array(z.string().max(120)).max(6).optional(),
  audienceSize: z.string().max(60).optional(),
});

/** Maps a product format to natural search keywords people actually use. */
function formatKeyword(format: string): string {
  const f = format.toLowerCase();
  if (f.includes("ebook")) return "ebook price";
  if (f.includes("guide")) return "digital guide price";
  if (f.includes("course") || f.includes("cohort")) return "online course fee";
  if (f.includes("consult")) return "consultation fee per session";
  if (f.includes("coaching")) return "online coaching fee";
  if (f.includes("community") || f.includes("membership")) return "membership price per month";
  if (f.includes("webinar")) return "webinar ticket price";
  if (f.includes("workshop")) return "workshop registration fee";
  if (f.includes("template")) return "template pack price";
  if (f.includes("checklist")) return "checklist pdf price";
  return "digital product price";
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

function fallbackIntel(message: string, currentPrice: number, researchedAt: string): PricingIntel {
  return {
    marketRange: null,
    competitors: [],
    verdict: "not_enough_data",
    verdictNote: `${message} Your AI-suggested price is still a sensible starting point for your niche and audience size - validate it with your first buyers.`,
    suggestedPriceInr: Math.max(49, Math.round(currentPrice)),
    suggestedNote:
      "No live competitor data was available right now. Start with this price, gather feedback from your first 10 buyers, then adjust.",
    researchedAt,
  };
}

export async function POST(req: Request) {
  const researchedAt = new Date().toISOString();
  let currentPrice = 499;

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Pricing research request was invalid." },
        { status: 400 },
      );
    }
    const { name, format, priceInr, niche, audienceSegments, audienceSize } = parsed.data;
    currentPrice = priceInr;

    if (!isTavilyConfigured()) {
      return NextResponse.json({
        ok: true,
        intel: fallbackIntel(
          "Live pricing research isn't configured on this deployment.",
          priceInr,
          researchedAt,
        ),
      });
    }

    const kw = formatKeyword(format);
    const nicheShort = niche.split(/[,;/]/)[0].trim().slice(0, 60);

    // Two complementary queries for better coverage, fired with a small stagger.
    const queries = [
      `${kw} ${nicheShort} India rupees price`,
      `${nicheShort} ${format} price INR India creators charge`,
    ];

    const settled = await Promise.allSettled([
      tavilySearch(queries[0], { maxResults: 6 }),
      (async () => {
        await pDelay(350);
        return tavilySearch(queries[1], { maxResults: 6 });
      })(),
    ]);

    const merged: Array<{ title: string; url: string; content: string }> = [];
    const seenUrls = new Set<string>();
    let answer: string | null = null;
    let searchFailures = 0;

    for (const s of settled) {
      if (s.status === "fulfilled") {
        if (!answer && s.value.answer) answer = s.value.answer;
        for (const r of s.value.results) {
          if (seenUrls.has(r.url)) continue;
          seenUrls.add(r.url);
          merged.push({ title: r.title, url: r.url, content: r.content });
        }
      } else {
        searchFailures++;
      }
    }

    // Total search failure -> graceful degradation, never a hard error for the user.
    if (merged.length === 0) {
      const reason =
        searchFailures === settled.length
          ? "The pricing search service didn't respond this time."
          : "The web search didn't return usable pricing pages for this product.";
      return NextResponse.json({
        ok: true,
        intel: fallbackIntel(reason, priceInr, researchedAt),
      });
    }

    const llm = await generateJSON({
      system: PRICING_SYSTEM,
      user: pricingResearchPrompt({
        productName: name,
        format,
        currentPriceInr: priceInr,
        niche,
        audienceSegments,
        audienceSize,
        searchAnswer: answer,
        searchResults: merged.slice(0, 10),
      }),
      schema: pricingIntelSchema,
      timeoutMs: 90_000,
      maxAttempts: 2,
    });

    // Post-processing guards: sane ranges, deduped sources, honest verdicts.
    let marketRange = llm.marketRange;
    if (marketRange) {
      let { min, max, typical } = marketRange;
      if (min > max) [min, max] = [max, min];
      min = Math.max(0, Math.round(min));
      max = Math.round(max);
      typical = Math.min(Math.max(0, Math.round(typical)), max || min);
      if (max === 0) marketRange = null;
      else marketRange = { min, max, typical: typical || Math.round((min + max) / 2) };
    }

    const seenComp = new Set<string>();
    const competitors = llm.competitors
      .filter((c) => {
        if (!c.url || seenComp.has(c.url)) return false;
        seenComp.add(c.url);
        return true;
      })
      .slice(0, 4)
      .map((c) => ({ ...c, source: c.source || domainOf(c.url) }));

    const hasRealData = marketRange !== null || competitors.some((c) => c.priceInr !== null);
    const verdict = hasRealData ? llm.verdict : "not_enough_data";

    const intel: PricingIntel = {
      marketRange,
      competitors,
      verdict,
      verdictNote: llm.verdictNote,
      suggestedPriceInr: Math.max(0, Math.round(llm.suggestedPriceInr)),
      suggestedNote: llm.suggestedNote,
      researchedAt,
    };

    return NextResponse.json({ ok: true, intel });
  } catch (err) {
    const message =
      err instanceof TavilyError || err instanceof AIError
        ? "Pricing research couldn't complete right now."
        : "Pricing research couldn't complete right now.";
    return NextResponse.json({
      ok: true,
      intel: fallbackIntel(message, currentPrice, researchedAt),
    });
  }
}
