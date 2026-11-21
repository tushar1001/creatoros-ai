import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Zod schemas validating every LLM output (AI workflow guardrails).  */
/* ------------------------------------------------------------------ */

export const intelligenceSchema = z.object({
  creator: z.object({
    name: z.string().min(1),
    niche: z.string().min(1),
    expertise: z.array(z.string()).min(1),
    contentPillars: z.array(z.string()).default([]),
    audience: z.array(z.string()).default([]),
    audienceProblems: z.array(z.string()).default([]),
    language: z.string().default("English"),
    tone: z.string().default("Friendly and encouraging"),
  }),
  monetisationOpportunities: z
    .array(z.object({ title: z.string().min(1), description: z.string().min(1) }))
    .default([]),
  summary: z.string().min(1),
  followUpQuestion: z.string().optional(),
  needsMoreInfo: z.boolean().default(false),
});
export type IntelligenceOutput = z.infer<typeof intelligenceSchema>;

export const aiProductSchema = z.object({
  name: z.string().min(2),
  format: z.string().min(2),
  priceINR: z.coerce.number().min(0).max(1_000_000),
  description: z.string().min(10),
  targetAudience: z.string().default(""),
  problemSolved: z.string().default(""),
  pricingRationale: z.string().default(""),
  difficulty: z.string().default("Medium"),
  launchStrategy: z.string().default(""),
  confidence: z.string().default("Moderate hypothesis"),
  whyRecommended: z.array(z.string()).default([]),
});
export type AIProductOutput = z.infer<typeof aiProductSchema>;

export const productsOutputSchema = z.object({
  products: z.array(aiProductSchema).min(1).max(6),
});

export const storefrontCopySchema = z.object({
  headline: z.string().min(3).max(160),
  bio: z.string().min(10).max(500),
  about: z.string().min(20),
  cta: z.string().min(2).max(40),
  theme: z.enum(["minimal", "bold", "editorial", "playful"]),
  themeReason: z.string().default(""),
});
export type StorefrontCopyOutput = z.infer<typeof storefrontCopySchema>;

export const pricingIntelSchema = z.object({
  marketRange: z
    .object({
      min: z.coerce.number().min(0),
      max: z.coerce.number().min(0),
      typical: z.coerce.number().min(0),
    })
    .nullable()
    .default(null),
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        source: z.string().min(1),
        url: z.string(),
        priceInr: z.coerce.number().min(0).nullable().default(null),
        note: z.string().default(""),
      }),
    )
    .max(6)
    .default([]),
  verdict: z.enum(["aligned", "underpriced", "overpriced", "not_enough_data"]),
  verdictNote: z.string().min(1),
  suggestedPriceInr: z.coerce.number().min(0),
  suggestedNote: z.string().default(""),
});
export type PricingIntelOutput = z.infer<typeof pricingIntelSchema>;

export const copilotResponseSchema = z.object({
  reply: z.string().min(1),
  actions: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("updateStore"),
          field: z.enum(["headline", "bio", "about", "cta", "theme", "accent"]),
          value: z.string().min(1),
        }),
        z.object({
          type: z.literal("updateProduct"),
          productId: z.string().min(1),
          field: z.enum(["name", "description", "targetAudience", "format", "priceInr"]),
          value: z.union([z.string(), z.coerce.number()]),
          requiresConfirmation: z.boolean().default(false),
        }),
        z.object({
          type: z.literal("addProduct"),
          product: aiProductSchema,
        }),
      ]),
    )
    .max(8)
    .default([]),
});
export type CopilotOutput = z.infer<typeof copilotResponseSchema>;
