import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { COPILOT_SYSTEM, copilotPrompt } from "@/lib/ai/prompts";
import { copilotResponseSchema } from "@/lib/ai/schemas";
import { generateJSON } from "@/lib/ai/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  storeId: z.string().max(64).optional(),
  creator: z.object({
    name: z.string().max(80),
    niche: z.string().max(120).default(""),
    language: z.string().max(20).default("English"),
    tone: z.string().max(120).optional(),
  }),
  store: z.unknown(),
  products: z.array(z.unknown()).max(12),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(20)
    .default([]),
  message: z.string().min(1).max(1000),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Copilot request was invalid. Please rephrase and retry." },
        { status: 400 },
      );
    }
    const { storeId, creator, store, products, history, message } = parsed.data;

    const result = await generateJSON({
      system: COPILOT_SYSTEM,
      user: copilotPrompt({
        creatorJson: JSON.stringify(creator, null, 2),
        storeJson: JSON.stringify(store, null, 2),
        productsJson: JSON.stringify(products, null, 2),
        history,
        message,
      }),
      schema: copilotResponseSchema,
    });

    // Persist the conversation for the creator's records.
    if (storeId) {
      try {
        await db.aiConversation.createMany({
          data: [
            { storeId, role: "user", message },
            { storeId, role: "assistant", message: result.reply },
          ],
        });
      } catch {
        // Conversation logging is best-effort; never block the editing flow.
      }
    }

    return NextResponse.json({ ok: true, reply: result.reply, actions: result.actions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The Copilot couldn't respond. Please retry.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
