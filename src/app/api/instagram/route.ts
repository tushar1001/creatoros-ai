import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeHandle, formatFollowers } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ username: z.string().min(1).max(120) });

export interface InstagramProbeResponse {
  ok: boolean;
  accessible: boolean;
  handle?: string;
  fullName?: string;
  bio?: string;
  followersText?: string | null;
  followersCount?: number | null;
  postsCount?: number | null;
  isVerified?: boolean;
  profilePicUrl?: string | null;
  recentCaptions?: string[];
  source?: "scrapecreators" | "opengraph";
  reason?: string;
  error?: string;
}

const SCRAPE_TIMEOUT_MS = 25_000;
const OG_TIMEOUT_MS = 7_000;
const MAX_CAPTIONS = 8;

/** Pull a text field out of a caption-shaped GraphQL edge list, defensively. */
function captionTexts(node: unknown): string[] {
  const out: string[] = [];
  const root = node as
    | {
        edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> };
        caption?: string;
        text?: string;
        title?: string;
      }
    | undefined;
  const edges = root?.edge_media_to_caption?.edges;
  if (Array.isArray(edges)) {
    for (const e of edges) {
      const t = e?.node?.text;
      if (typeof t === "string" && t.trim()) out.push(t.trim());
    }
  }
  if (out.length === 0 && typeof root?.caption === "string" && root.caption.trim()) {
    out.push(root.caption.trim());
  }
  if (out.length === 0 && typeof root?.text === "string" && root.text.trim()) {
    out.push(root.text.trim());
  }
  if (out.length === 0 && typeof root?.title === "string" && root.title.trim()) {
    out.push(root.title.trim());
  }
  return out;
}

/**
 * Primary source: ScrapeCreators public Instagram profile API.
 * Returns null when the provider is unreachable/unauthorised (caller falls
 * back to OpenGraph scraping). Never throws.
 */
async function scrapeViaScrapeCreators(
  handle: string,
): Promise<InstagramProbeResponse | null> {
  const apiKey = process.env.INSTAGRAM_SCRAPER_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://api.scrapecreators.com/v1/instagram/profile?handle=${encodeURIComponent(handle)}`,
      {
        headers: { "x-api-key": apiKey, accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (res.status === 401 || res.status === 402 || res.status === 403) {
      // Auth or credit problem with the provider key - degrade quietly.
      console.warn(`[instagram] ScrapeCreators auth/credit issue (HTTP ${res.status})`);
      return null;
    }

    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json) return null;

    // Structured "profile state" responses (not found / restricted / age gate).
    if (json.error === "not_found") {
      const msg = typeof json.message === "string" ? json.message : "";
      return {
        ok: true,
        accessible: false,
        handle,
        reason: msg.includes("restricted") || msg.includes("age")
          ? "This profile is restricted on Instagram, so we can't read it. Describe yourself instead."
          : "We couldn't find that Instagram account. Double-check the username or describe yourself instead.",
      };
    }
    if (json.success === false) {
      console.warn(`[instagram] ScrapeCreators failure: ${String(json.message ?? "unknown")}`);
      return null;
    }
    if (!res.ok) {
      console.warn(`[instagram] ScrapeCreators HTTP ${res.status}`);
      return null;
    }

    // The payload nests the profile under data.user (GraphQL shape), but we
    // parse defensively across flattened variants.
    const container =
      ((json.data as Record<string, unknown> | undefined)?.user as
        | Record<string, unknown>
        | undefined) ??
      (json.user as Record<string, unknown> | undefined) ??
      (json.data as Record<string, unknown> | undefined) ??
      {};

    const str = (k: string): string => {
      const v = container[k] ?? json[k];
      return typeof v === "string" ? v : "";
    };
    const num = (k: string): number | null => {
      const v = container[k] ?? json[k];
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    };

    const followerCount =
      num("follower_count") ??
      ((container.edge_followed_by as { count?: unknown } | undefined)?.count as
        | number
        | undefined) ??
      null;
    const postsCount =
      num("media_count") ??
      ((container.edge_owner_to_timeline_media as { count?: unknown } | undefined)?.count as
        | number
        | undefined) ??
      null;
    const fullName = str("full_name") || str("username") || handle;
    const bio = str("biography") || str("bio");

    const timeline =
      (container.edge_owner_to_timeline_media as
        | { edges?: unknown[] }
        | undefined) ??
      (container.posts as { edges?: unknown[] } | undefined) ??
      (Array.isArray(container.recent_posts) ? { edges: container.recent_posts } : null);
    const recentCaptions: string[] = [];
    if (Array.isArray(timeline?.edges)) {
      for (const edge of timeline.edges) {
        const node = (edge as { node?: unknown } | undefined)?.node ?? edge;
        for (const t of captionTexts(node)) {
          recentCaptions.push(t);
          if (recentCaptions.length >= MAX_CAPTIONS) break;
        }
        if (recentCaptions.length >= MAX_CAPTIONS) break;
      }
    }

    const hasAnything = Boolean(fullName || bio || followerCount != null || recentCaptions.length > 0);
    if (!hasAnything) return null;

    return {
      ok: true,
      accessible: true,
      handle,
      fullName,
      bio: bio.slice(0, 600),
      followersText: followerCount != null ? formatFollowers(followerCount) : null,
      followersCount: followerCount,
      postsCount: postsCount,
      isVerified: container.is_verified === true || container.isVerified === true,
      profilePicUrl:
        str("profile_pic_url_hd") ||
        str("profile_pic_url") ||
        (typeof container.profilePicUrl === "string" ? container.profilePicUrl : null) ||
        null,
      recentCaptions: recentCaptions.map((c) => c.slice(0, 220)),
      source: "scrapecreators",
    };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "AbortError") console.warn("[instagram] ScrapeCreators timed out");
    else console.warn(`[instagram] ScrapeCreators error: ${err instanceof Error ? err.message : err}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fallback source: public OpenGraph meta tags Instagram serves to anonymous
 * visitors. Often blocked; that's fine, we degrade gracefully.
 */
async function scrapeViaOpenGraph(
  handle: string,
): Promise<InstagramProbeResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OG_TIMEOUT_MS);
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        ok: true,
        accessible: false,
        reason: "Instagram didn't share this profile with us (they restrict automated access).",
        handle,
      };
    }

    const html = await res.text();
    const ogTitle =
      html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/content=["']([^"']+)["']\s+property=["']og:title["']/i)?.[1];
    const ogDesc =
      html.match(/property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/content=["']([^"']+)["']\s+property=["']og:description["']/i)?.[1];

    if (!ogDesc && !ogTitle) {
      return {
        ok: true,
        accessible: false,
        reason: "We couldn't read this profile's public details (Instagram limits automated access).",
        handle,
      };
    }

    const nameMatch = ogTitle?.match(/^(.*?)\s*\(@/)?.[1]?.trim();
    const followersMatch = ogDesc?.match(/([\d,.]+\s*[KMB]?)\s*Followers/i)?.[1];

    return {
      ok: true,
      accessible: true,
      handle,
      fullName: nameMatch ?? handle,
      bio: ogDesc?.replace(/\s*See Instagram photos and videos from .*$/i, "").trim() ?? "",
      followersText: followersMatch ?? null,
      followersCount: null,
      source: "opengraph",
    };
  } catch {
    return {
      ok: true,
      accessible: false,
      reason: "We couldn't reach Instagram right now (they restrict automated access).",
      handle,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, accessible: false, error: "Please enter a valid username." },
      { status: 400 },
    );
  }

  const handle = normalizeHandle(parsed.data.username);
  if (!handle || handle.length < 2) {
    return NextResponse.json({
      ok: true,
      accessible: false,
      reason: "That username doesn't look right. Try again or describe yourself instead.",
    });
  }

  // 1) Dedicated scraping API, 2) public OpenGraph, 3) graceful describe-mode.
  const viaApi = await scrapeViaScrapeCreators(handle);
  const result =
    viaApi ??
    (await scrapeViaOpenGraph(handle));

  return NextResponse.json(result);
}
