import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { storeDraftSchema, productDraftSchema } from "@/lib/validation";
import type { PricingIntel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ key: string }> };

async function findStore(key: string) {
  let store = await db.store.findUnique({
    where: { slug: key },
    include: { creator: true, products: true },
  });
  if (!store) {
    store = await db.store.findUnique({
      where: { id: key },
      include: { creator: true, products: true },
    });
  }
  return store;
}

function mapStore(store: NonNullable<Awaited<ReturnType<typeof findStore>>>) {
  const socials = safeParseJson(store.socials, {});
  return {
    id: store.id,
    slug: store.slug,
    store: {
      headline: store.headline,
      bio: store.bio,
      about: store.about,
      cta: store.cta,
      theme: store.theme,
      accent: store.accent,
      profileImage: store.profileImage ?? "",
      socials,
      status: store.status as "draft" | "published",
    },
    products: [...store.products]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((p) => ({
        id: p.id,
        name: p.name,
        format: p.format,
        priceInr: p.priceInr,
        description: p.description,
        targetAudience: p.targetAudience,
        problemSolved: p.problemSolved,
        pricingRationale: p.pricingRationale,
        difficulty: p.difficulty,
        launchStrategy: p.launchStrategy,
        confidence: p.confidence,
        whyRecommended: safeParseJson<string[]>(p.whyRecommended, []),
        selected: true,
        coverStyle: p.coverStyle,
        pricingIntel: safeParseJson<PricingIntel | null>(p.pricingIntel, null),
      })),
    creator: {
      name: store.creator.name ?? "Creator",
      niche: store.creator.niche ?? "",
      instagramHandle: store.creator.instagramHandle ?? "",
      followers: store.creator.followers,
    },
  };
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { key } = await params;
    if (!key) {
      return NextResponse.json({ ok: false, error: "Store not found." }, { status: 404 });
    }
    const store = await findStore(key);
    if (!store) {
      return NextResponse.json(
        { ok: false, error: "This store doesn't exist (yet). It may still be being built." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, ...mapStore(store) });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load this store." }, { status: 500 });
  }
}

const patchSchema = z.object({
  store: storeDraftSchema.partial().optional(),
  products: z.array(productDraftSchema).max(12).optional(),
});

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { key } = await params;
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Could not save changes. Please retry." },
        { status: 400 },
      );
    }
    const { store: storePatch, products } = parsed.data;

    const store = await findStore(key);
    if (!store) {
      return NextResponse.json(
        { ok: false, error: "This store no longer exists." },
        { status: 404 },
      );
    }

    const mapping: Array<{ tempId: string; realId: string }> = [];

    await db.$transaction(async (tx) => {
      if (storePatch && Object.keys(storePatch).length > 0) {
        await tx.store.update({
          where: { id: store.id },
          data: {
            ...storePatch,
            profileImage:
              storePatch.profileImage !== undefined
                ? storePatch.profileImage || null
                : undefined,
            socials: storePatch.socials !== undefined ? JSON.stringify(storePatch.socials) : undefined,
            publishedAt:
              storePatch.status === "published" && store.status !== "published"
                ? new Date()
                : undefined,
          },
        });
      }

      if (products) {
        const existing = await tx.product.findMany({ where: { storeId: store.id } });
        const keepIds = new Set<string>();

        for (const [idx, p] of products.entries()) {
          const data = {
            name: p.name,
            format: p.format,
            priceInr: Math.round(p.priceInr),
            description: p.description,
            targetAudience: p.targetAudience,
            problemSolved: p.problemSolved,
            pricingRationale: p.pricingRationale,
            difficulty: p.difficulty,
            launchStrategy: p.launchStrategy,
            confidence: p.confidence,
            whyRecommended: JSON.stringify(p.whyRecommended ?? []),
            coverStyle: p.coverStyle,
            pricingIntel:
              p.pricingIntel !== undefined && p.pricingIntel !== null
                ? JSON.stringify(p.pricingIntel)
                : null,
            displayOrder: idx,
          };
          if (p.id && existing.some((e) => e.id === p.id)) {
            await tx.product.update({ where: { id: p.id }, data });
            keepIds.add(p.id);
          } else {
            const created = await tx.product.create({ data: { ...data, storeId: store.id } });
            keepIds.add(created.id);
            mapping.push({ tempId: p.id ?? "", realId: created.id });
          }
        }

        const toDelete = existing.filter((e) => !keepIds.has(e.id));
        if (toDelete.length > 0) {
          await tx.product.deleteMany({ where: { id: { in: toDelete.map((e) => e.id) } } });
        }
      }
    });

    return NextResponse.json({ ok: true, mapping });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save changes. Please retry.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
