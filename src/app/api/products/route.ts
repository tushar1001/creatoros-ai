import { NextResponse } from "next/server";
import { z } from "zod";
import { PRODUCTS_SYSTEM, discoverProductsPrompt } from "@/lib/ai/prompts";
import { intelligenceSchema, productsOutputSchema } from "@/lib/ai/schemas";
import { generateJSON } from "@/lib/ai/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  intelligence: intelligenceSchema,
  mode: z.enum(["batch", "more", "regenerate"]).default("batch"),
  count: z.coerce.number().int().min(1).max(4).optional(),
  excludeNames: z.array(z.string()).max(12).optional(),
  instruction: z.string().max(500).optional(),
  original: z.unknown().optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Product discovery request was invalid. Please retry." },
        { status: 400 },
      );
    }
    const { intelligence, mode, count, excludeNames, instruction, original } = parsed.data;

    const safeCount =
      mode === "regenerate" ? 1 : Math.min(4, Math.max(2, count ?? (mode === "more" ? 2 : 3)));

    const products = await generateJSON({
      system: PRODUCTS_SYSTEM,
      user: discoverProductsPrompt({
        intelligenceJson: JSON.stringify(intelligence, null, 2),
        count: safeCount,
        excludeNames,
        instruction,
        originalProductJson: original ? JSON.stringify(original, null, 2) : undefined,
      }),
      schema: productsOutputSchema,
    });

    return NextResponse.json({ ok: true, products: products.products });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Product generation failed. Please try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
