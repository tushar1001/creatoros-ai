"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowLeft, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIGenerationScreenProps {
  title: string;
  messages: string[];
  error?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
  /** Optional illustrative photo shown while working (path under /public). */
  mascot?: string;
  mascotAlt?: string;
}

/**
 * Shared premium loading / error screen for long-running AI workflows.
 */
export function AIGenerationScreen({
  title,
  messages,
  error,
  onRetry,
  onBack,
  backLabel = "Go back",
  mascot,
  mascotAlt = "",
}: AIGenerationScreenProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (error) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 2600);
    return () => clearInterval(t);
  }, [messages.length, error]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#FCFBFA] px-4">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="animate-blob absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#7655E9]/15 blur-3xl" />
        <div className="animate-blob absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#FF927F]/20 blur-3xl [animation-delay:-6s]" />
        <div className="animate-blob absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-[#4931A7]/15 blur-3xl [animation-delay:-11s]" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-3xl bg-[#7655E9]/30 blur-xl animate-pulse-soft" />
          {mascot ? (
            <div className="relative h-40 w-40 overflow-hidden rounded-[2.25rem] border-4 border-white bg-gradient-to-br from-[#F0ECFF] to-[#FFE4D8] shadow-3d">
              <Image
                src={mascot}
                alt={mascotAlt}
                fill
                sizes="160px"
                className="animate-bounce-soft object-cover"
                priority
              />
            </div>
          ) : (
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#7655E9] to-[#4931A7] shadow-xl">
              <Sparkles className="size-9 text-white" />
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252331]">{title}</h1>

        {error ? (
          <div className="mt-6 w-full rounded-2xl border border-[#F3D3D3] bg-white p-5 text-left shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#D64550]" />
              <div>
                <p className="text-sm font-semibold text-[#252331]">That didn&apos;t work</p>
                <p className="mt-1 text-sm text-[#6E6980] leading-relaxed">{error}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="h-11 bg-gradient-to-r from-[#7655E9] to-[#4931A7] text-white hover:opacity-90"
                >
                  <RotateCw className="size-4" /> Try again
                </Button>
              )}
              {onBack && (
                <Button variant="outline" className="h-11" onClick={onBack}>
                  <ArrowLeft className="size-4" /> {backLabel}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <p key={index} className="mt-4 h-6 text-[15px] font-medium text-[#4931A7] animate-fade-up">
              {messages[index]}
            </p>
            <div className="mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#F0ECFF]">
              <div className="shimmer-bg h-full w-full rounded-full" />
            </div>
            <p className="mt-6 text-xs text-[#8B8694]">
              Real AI generation usually takes 10-40 seconds. Your work is saved locally.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
