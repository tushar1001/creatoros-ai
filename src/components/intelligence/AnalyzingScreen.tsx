"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { normalizeHandle } from "@/lib/format";
import type { CreatorIntel } from "@/lib/types";
import { AIGenerationScreen } from "@/components/intelligence/AIGenerationScreen";

const MESSAGES = [
  "Reading your creator DNA…",
  "Mapping your audience…",
  "Finding monetisation angles…",
  "Spotting what your followers would pay for…",
  "Brewing AI magic…",
];

export function AnalyzingScreen() {
  const onboarding = useAppStore((s) => s.onboarding);
  const creatorId = useAppStore((s) => s.creatorId);
  const setCreatorId = useAppStore((s) => s.setCreatorId);
  const setIntelligence = useAppStore((s) => s.setIntelligence);
  const setStep = useAppStore((s) => s.setStep);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiPost<{ creatorId: string; intelligence: CreatorIntel }>(
          "/api/analyze",
          {
            creatorId: creatorId ?? undefined,
            description: onboarding.description || undefined,
            instagramHandle: normalizeHandle(onboarding.instagramHandle) || undefined,
            name: onboarding.name || undefined,
            niche: onboarding.niche || undefined,
            followers: onboarding.followers || undefined,
            language: onboarding.language,
            audience: onboarding.audience || undefined,
            monetisationExp: onboarding.monetisationExp || undefined,
          },
        );
        if (cancelled) return;
        setCreatorId(res.creatorId);
        setIntelligence(res.intelligence);
        setStep("intelligence");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <AIGenerationScreen
      title="Analyzing your creator DNA"
      messages={MESSAGES}
      error={error}
      onRetry={() => {
        setError(null);
        setAttempt((a) => a + 1);
      }}
      onBack={() => setStep("onboarding")}
      backLabel="Edit my details"
      mascot="/creators/step-scan.png"
      mascotAlt="Indian creator filming content with her phone and ring light"
    />
  );
}
