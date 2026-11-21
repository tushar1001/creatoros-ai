import type { ThemeKey } from "@/lib/themes";

export type Language = "English" | "Hindi" | "Hinglish";

export interface OnboardingInput {
  mode: "instagram" | "describe";
  instagramHandle: string;
  description: string;
  name: string;
  niche: string;
  followers: string;
  language: Language;
  audience: string;
  monetisationExp: string;
}

export interface MonetisationOpportunity {
  title: string;
  description: string;
}

export interface CreatorIntel {
  creator: {
    name: string;
    niche: string;
    expertise: string[];
    contentPillars: string[];
    audience: string[];
    audienceProblems: string[];
    language: string;
    tone: string;
  };
  monetisationOpportunities: MonetisationOpportunity[];
  summary: string;
  followUpQuestion?: string;
  needsMoreInfo?: boolean;
}

/** A real competitor price signal extracted from live web search (Tavily). */
export interface CompetitorRef {
  name: string;
  source: string;
  url: string;
  priceInr: number | null;
  note: string;
}

/** Live pricing intelligence attached to a product after web research. */
export interface PricingIntel {
  marketRange: { min: number; max: number; typical: number } | null;
  competitors: CompetitorRef[];
  verdict: "aligned" | "underpriced" | "overpriced" | "not_enough_data";
  verdictNote: string;
  suggestedPriceInr: number;
  suggestedNote: string;
  researchedAt: string;
}

export interface ProductDraft {
  id: string;
  name: string;
  format: string;
  priceInr: number;
  description: string;
  targetAudience: string;
  problemSolved: string;
  pricingRationale: string;
  difficulty: string;
  launchStrategy: string;
  confidence: string;
  whyRecommended: string[];
  selected: boolean;
  coverStyle: number;
  pricingIntel?: PricingIntel | null;
}

/** Raw product as returned by the AI before receiving a local id. */
export type AIProduct = Omit<ProductDraft, "id" | "selected" | "coverStyle"> & {
  priceINR?: number;
};

export interface StoreSocials {
  instagram?: string;
  youtube?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
}

export interface StoreDraft {
  headline: string;
  bio: string;
  about: string;
  cta: string;
  theme: ThemeKey;
  accent: string;
  profileImage: string;
  socials: StoreSocials;
  status: "draft" | "published";
}

export interface PublicCreator {
  name: string;
  niche: string;
  instagramHandle: string;
  followers: number | null;
}

export interface StorePayload {
  id: string;
  slug: string;
  store: StoreDraft;
  products: ProductDraft[];
  creator: PublicCreator;
}

export type Step =
  | "landing"
  | "onboarding"
  | "analyzing"
  | "intelligence"
  | "lab"
  | "generating"
  | "editor"
  | "publish";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type CopilotAction =
  | {
      type: "updateStore";
      field: "headline" | "bio" | "about" | "cta" | "theme" | "accent";
      value: string;
    }
  | {
      type: "updateProduct";
      productId: string;
      field: "name" | "description" | "targetAudience" | "format" | "priceInr";
      value: string | number;
      requiresConfirmation?: boolean;
    }
  | {
      type: "addProduct";
      product: Partial<AIProduct> & { name: string };
    };

export interface CopilotResult {
  reply: string;
  actions: CopilotAction[];
}
