import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ANALYZE_SYSTEM, analyzeCreatorPrompt } from "@/lib/ai/prompts";
import { intelligenceSchema } from "@/lib/ai/schemas";
import { generateJSON } from "@/lib/ai/llm";
import { parseFollowers } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  creatorId: z.string().max(64).optional(),
  description: z.string().max(4000).optional(),
  instagramHandle: z.string().max(80).optional(),
  name: z.string().max(80).optional(),
  niche: z.string().max(80).optional(),
  followers: z.string().max(20).optional(),
  language: z.string().max(20).optional(),
  audience: z.string().max(300).optional(),
  monetisationExp: z.string().max(120).optional(),
  extraContext: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: "That input didn't look right. Please check and try again." },
        { status: 400 },
      );
    }
    const input = body.data;
    const hasDescription = (input.description ?? "").trim().length >= 5;
    const hasHandle = (input.instagramHandle ?? "").trim().length >= 2;
    if (!hasDescription && !hasHandle) {
      return NextResponse.json(
        { ok: false, error: "Tell us a little about yourself or add your Instagram username so our AI has something to work with." },
        { status: 400 },
      );
    }

    const intelligence = await generateJSON({
      system: ANALYZE_SYSTEM,
      user: analyzeCreatorPrompt(input),
      schema: intelligenceSchema,
    });

    // Update the existing creator profile when the session provides one
    // (corrections / re-analysis), otherwise create a fresh record.
    const creatorData = {
      name: intelligence.creator.name,
      instagramHandle: (input.instagramHandle ?? "").trim() || null,
      description: (input.description ?? "").trim() || null,
      niche: intelligence.creator.niche,
      expertise: JSON.stringify(intelligence.creator.expertise),
      audience: JSON.stringify(intelligence.creator.audience),
      language: input.language || intelligence.creator.language,
      followers: parseFollowers(input.followers ?? ""),
      monetisationExp: input.monetisationExp || null,
      intelligence: JSON.stringify(intelligence),
    };

    let creator = null;
    if (input.creatorId) {
      const existing = await db.creator.findUnique({ where: { id: input.creatorId } });
      if (existing) {
        creator = await db.creator.update({ where: { id: existing.id }, data: creatorData });
      }
    }
    if (!creator) {
      creator = await db.creator.create({ data: creatorData });
    }

    return NextResponse.json({ ok: true, creatorId: creator.id, intelligence });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed. Please try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
