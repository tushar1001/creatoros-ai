"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { normalizeHandle } from "@/lib/format";
import type { StoreDraft } from "@/lib/types";
import { AIGenerationScreen } from "@/components/intelligence/AIGenerationScreen";

const MESSAGES = [
  "Writing your headline and bio…",
  "Choosing a theme that fits your niche…",
  "Polishing your product pages…",
  "Adding the final touches…",
];

export function GeneratingScreen() {
  const setStep = useAppStore((s) => s.setStep);
  const setStore = useAppStore((s) => s.setStore);
  const setStoreId = useAppStore((s) => s.setStoreId);
  const setSlug = useAppStore((s) => s.setSlug);
  const remapProductId = useAppStore((s) => s.remapProductId);
  const clearHistoryStacks = useAppStore((s) => s.clearHistoryStacks);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = useAppStore.getState();
        const selected = s.products.filter((p) => p.selected);
        if (selected.length === 0) throw new Error("No products were selected. Go back and pick at least one.");

        // Resume case: storefront already exists - jump straight to the editor.
        if (s.store && s.storeId) {
          clearHistoryStacks();
          setStep("editor");
          return;
        }

        let draft: StoreDraft;
        if (s.store) {
          draft = s.store;
        } else {
          if (!s.intelligence) throw new Error("Your creator session expired. Please start again.");
          const copyRes = await apiPost<{ copy: { headline: string; bio: string; about: string; cta: string; theme: "minimal" | "bold" | "editorial" | "playful" } }>(
            "/api/storefront-copy",
            {
              intelligence: s.intelligence,
              products: selected.map((p) => ({ name: p.name, format: p.format, priceINR: p.priceInr })),
            },
          );
          const copy = copyRes.copy;
          const handle = normalizeHandle(s.onboarding.instagramHandle);
          draft = {
            headline: copy.headline,
            bio: copy.bio,
            about: copy.about,
            cta: copy.cta,
            theme: copy.theme,
            accent: "#7655E9",
            profileImage: "",
            socials: handle ? { instagram: handle } : {},
            status: "draft",
          };
        }

        let storeId = s.storeId;
        let slug = s.slug;
        if (!storeId) {
          const persistRes = await apiPost<{ storeId: string; slug: string; idMap: Array<{ tempId: string; realId: string }> }>(
            "/api/store",
            {
              creatorId: s.creatorId,
              creatorName: s.intelligence?.creator.name ?? "Creator",
              creatorNiche: s.intelligence?.creator.niche,
              store: draft,
              products: selected,
            },
          );
          storeId = persistRes.storeId;
          slug = persistRes.slug;
          for (const m of persistRes.idMap) {
            if (m.tempId && m.realId) remapProductId(m.tempId, m.realId);
          }
        }

        if (cancelled) return;
        setStore(draft);
        setStoreId(storeId);
        setSlug(slug);
        clearHistoryStacks();
        setStep("editor");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Storefront generation failed. Please retry.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <AIGenerationScreen
      title="Designing your storefront"
      messages={MESSAGES}
      error={error}
      onRetry={() => {
        setError(null);
        setAttempt((a) => a + 1);
      }}
      onBack={() => setStep("lab")}
      backLabel="Back to Product Lab"
      mascot="/creators/step-store.png"
      mascotAlt="Indian creator showing her live storefront on a phone"
    />
  );
}
