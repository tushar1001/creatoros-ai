import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { storeDraftSchema, productDraftSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  creatorId: z.string().min(1),
  creatorName: z.string().min(1).max(80),
  creatorNiche: z.string().max(120).optional(),
  store: storeDraftSchema,
  products: z.array(productDraftSchema).min(1).max(8),
});

export async function POST(req: Request) {
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Could not create the store. Please review your products and retry." },
        { status: 400 },
      );
    }
    const { creatorId, creatorName, creatorNiche, store, products } = parsed.data;

    const creator = await db.creator.findUnique({ where: { id: creatorId } });
    if (!creator) {
      return NextResponse.json(
        { ok: false, error: "Creator session expired. Please start again." },
        { status: 404 },
      );
    }

    // Unique, human-friendly slug: name + first niche word, then -2, -3 ...
    const nicheWord = (creatorNiche ?? "").split(/[\s,&/]+/).filter(Boolean)[0] ?? "store";
    const base = `${slugify(creatorName)}-${slugify(nicheWord)}`;
    let slug = base;
    let n = 2;
    while (true) {
      const exists = await db.store.findUnique({ where: { slug } });
      if (!exists) break;
      slug = `${base}-${n++}`;
      if (n > 50) {
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        break;
      }
    }

    const created = await db.store.create({
      data: {
        creatorId,
        slug,
        headline: store.headline,
        bio: store.bio,
        about: store.about,
        theme: store.theme,
        accent: store.accent,
        cta: store.cta,
        profileImage: store.profileImage || null,
        socials: JSON.stringify(store.socials),
        status: store.status,
        publishedAt: store.status === "published" ? new Date() : null,
        products: {
          create: products.map((p, idx) => ({
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
          })),
        },
      },
      include: { products: true },
    });

    const savedProducts = created.products.sort((a, b) => a.displayOrder - b.displayOrder);
    // Map the client's temp ids to the real db ids (order-preserving).
    const idMap = products.map((p, idx) => ({
      tempId: p.id ?? "",
      realId: savedProducts[idx]?.id ?? p.id ?? "",
    }));

    return NextResponse.json({
      ok: true,
      storeId: created.id,
      slug: created.slug,
      idMap,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create the store. Please retry.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
