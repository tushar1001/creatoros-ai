"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Pencil,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import StorefrontView from "@/components/storefront/StorefrontView";

const CONFETTI_COLORS = ["#7655E9", "#4931A7", "#FF927F", "#FFE4D8", "#299D70", "#E8A33D"];

export default function PublishScreen() {
  const store = useAppStore((s) => s.store);
  const products = useAppStore((s) => s.products);
  const slug = useAppStore((s) => s.slug);
  const intelligence = useAppStore((s) => s.intelligence);
  const onboarding = useAppStore((s) => s.onboarding);
  const setStep = useAppStore((s) => s.setStep);
  const [copied, setCopied] = useState(false);

  // Share link base. NEXT_PUBLIC_SITE_URL (set in .env) wins when deployed to a
  // custom domain, e.g. https://mystore.in - otherwise we fall back to the
  // current browsing origin.
  const [origin] = useState(() =>
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : ""),
  );
  const fullUrl = slug ? `${origin}/store/${slug}` : "";

  const confetti = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.2,
        duration: 2.6 + Math.random() * 2.4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );

  if (!store || !slug) return null;

  const creator = {
    name: intelligence?.creator.name ?? onboarding.name ?? "Creator",
    niche: intelligence?.creator.niche ?? onboarding.niche,
    handle: store.socials.instagram ?? onboarding.instagramHandle.replace(/^@+/, ""),
  };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copied - paste it anywhere!");
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.error("Couldn't copy automatically. Long-press the link to copy it.");
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `I just launched my creator store! Come check it out: ${fullUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${creator.name}'s creator store`,
          text: "Check out my new creator store!",
          url: fullUrl,
        });
      } catch {
        /* user dismissed the share sheet */
      }
    } else {
      void copyLink();
    }
  }

  return (
    <div className="relative min-h-screen bg-[#FCFBFA]">
      {/* Confetti */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        {confetti.map((c, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${c.left}%`,
              backgroundColor: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
            }}
          />
        ))}
      </div>

      <main className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
        <div className="animate-fade-up text-center">
          <div className="relative mx-auto h-24 w-24">
            <div className="relative h-24 w-24 overflow-hidden rounded-[1.75rem] border-4 border-white bg-gradient-to-br from-[#F0ECFF] to-[#FFE4D8] shadow-3d">
              <Image
                src="/creators/celebrate.png"
                alt="Creator celebrating her new store on her phone"
                fill
                sizes="96px"
                className="animate-bounce-soft object-cover"
                priority
              />
            </div>
            <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#299D70] shadow-md">
              <Check className="size-4 text-white" />
            </span>
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-[#252331]">
            Your store is ready!
          </h1>
          <p className="mt-2 text-[15px] text-[#6E6980]">
            Your storefront is live. Share it with your audience on Instagram, WhatsApp and
            beyond.
          </p>
        </div>

        {/* URL card */}
        <div className="animate-fade-up mt-8 rounded-2xl border border-[#EAE5E0] bg-white p-4 shadow-[0_2px_12px_rgba(37,35,49,0.08)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 rounded-xl bg-[#F7F5FF] px-4 py-3">
              <p className="truncate font-mono text-sm text-[#4931A7]" aria-label="Store URL">
                {fullUrl}
              </p>
            </div>
            <Button
              onClick={() => void copyLink()}
              className="h-11 gap-2 bg-gradient-to-r from-[#7655E9] to-[#4931A7] text-white hover:opacity-90 sm:w-32"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Button
              variant="outline"
              className="h-11 gap-2 border-[#CDEBDD] bg-[#F2FBF7] text-[#166B4C] hover:bg-[#E2F3EC]"
              onClick={shareWhatsApp}
            >
              <MessageCircle className="size-4" /> WhatsApp
            </Button>
            <Button
              variant="outline"
              className="h-11 gap-2 border-[#D9D3E8]"
              onClick={() => void shareNative()}
            >
              <Share2 className="size-4" /> Share
            </Button>
            <Button
              variant="outline"
              className="col-span-2 h-11 gap-2 border-[#D9D3E8] sm:col-span-1"
              onClick={() => window.open(`/store/${slug}`, "_blank", "noopener")}
            >
              <ExternalLink className="size-4" /> Open store
            </Button>
          </div>
        </div>

        {/* Sharing tips */}
        <div className="animate-fade-up mt-4 rounded-2xl border border-dashed border-[#D9D3E8] bg-white/70 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#252331]">
            <Sparkles className="size-4 text-[#7655E9]" /> Launch tips for your first 100 sales
          </p>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-[#6E6980]">
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7655E9]" />
              Add your store link to your Instagram bio and pin a Reels announcing it.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7655E9]" />
              Share the link in your WhatsApp Status - your warmest audience is there.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7655E9]" />
              Start with one product at an accessible price, then validate demand.
            </li>
          </ul>
        </div>

        {/* Phone preview */}
        <div className="animate-fade-up mt-8">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-[#8B8694]">
            This is what your audience will see
          </p>
          <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[2rem] border-[7px] border-[#252331] bg-white shadow-2xl">
            <StorefrontView
              store={store}
              products={products}
              creator={creator}
              preview
              onProductCta={() => toast.info("This is a preview - open your live store to test CTAs.")}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            className="h-12 gap-2 border-[#D9D3E8]"
            onClick={() => setStep("editor")}
          >
            <Pencil className="size-4" /> Continue editing
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-[#8B8694]">
          Your storefront updates automatically whenever you edit it.
        </p>
      </main>
    </div>
  );
}
