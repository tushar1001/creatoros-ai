import { NextResponse } from "next/server";
import { z } from "zod";
import { COPY_SYSTEM, storefrontCopyPrompt } from "@/lib/ai/prompts";
import { intelligenceSchema, storefrontCopySchema } from "@/lib/ai/schemas";
import { generateJSON } from "@/lib/ai/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  intelligence: intelligenceSchema,
  products: z
    .array(
      z.object({
        name: z.string().min(1),
        format: z.string().min(1),
        priceINR: z.coerce.number(),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Storefront generation request was invalid. Please retry." },
        { status: 400 },
      );
    }
    const { intelligence, products } = parsed.data;

    const copy = await generateJSON({
      system: COPY_SYSTEM,
      user: storefrontCopyPrompt(
        {
          name: intelligence.creator.name,
          niche: intelligence.creator.niche,
          language: intelligence.creator.language,
          tone: intelligence.creator.tone,
        },
        intelligence.summary,
        products,
      ),
      schema: storefrontCopySchema,
    });

    return NextResponse.json({ ok: true, copy });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storefront generation failed. Please try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
