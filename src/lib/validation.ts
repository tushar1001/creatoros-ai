import { z } from "zod";

/** Validation schemas for API request bodies (store + product drafts). */

export const storeDraftSchema = z.object({
  headline: z.string().max(200).default(""),
  bio: z.string().max(600).default(""),
  about: z.string().max(4000).default(""),
  cta: z.string().max(40).default("Get instant access"),
  theme: z.enum(["minimal", "bold", "editorial", "playful"]).default("minimal"),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7655E9"),
  profileImage: z.string().max(1000).default(""),
  socials: z
    .object({
      instagram: z.string().max(80).optional(),
      youtube: z.string().max(200).optional(),
      whatsapp: z.string().max(20).optional(),
      email: z.string().max(120).optional(),
      website: z.string().max(200).optional(),
    })
    .default({}),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const productDraftSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().min(1).max(200),
  format: z.string().min(1).max(120),
  priceInr: z.coerce.number().min(0).max(1_000_000),
  description: z.string().max(4000).default(""),
  targetAudience: z.string().max(300).default(""),
  problemSolved: z.string().max(600).default(""),
  pricingRationale: z.string().max(1000).default(""),
  difficulty: z.string().max(20).default("Easy"),
  launchStrategy: z.string().max(600).default(""),
  confidence: z.string().max(40).default("Moderate hypothesis"),
  whyRecommended: z.array(z.string().max(300)).max(8).default([]),
  selected: z.boolean().default(true),
  coverStyle: z.coerce.number().int().min(0).max(99).default(0),
  // Live competitor pricing research (JSON blob produced by /api/pricing).
  pricingIntel: z.unknown().optional(),
});
