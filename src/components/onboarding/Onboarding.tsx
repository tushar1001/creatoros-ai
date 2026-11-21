"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { DEMO_PROFILES } from "@/lib/demo";
import { initialsOf, normalizeHandle } from "@/lib/format";
import type { Language, OnboardingInput } from "@/lib/types";

interface InstagramProbe {
  ok: boolean;
  accessible: boolean;
  handle?: string;
  fullName?: string;
  bio?: string;
  followersText?: string | null;
  followersCount?: number | null;
  postsCount?: number | null;
  isVerified?: boolean;
  profilePicUrl?: string | null;
  recentCaptions?: string[];
  source?: "scrapecreators" | "opengraph";
  reason?: string;
  error?: string;
}

/** Build an AI-ready description from live public Instagram data. */
function composeDescription(probe: InstagramProbe): string {
  const parts: string[] = [];
  if (probe.bio?.trim()) parts.push(probe.bio.trim());
  const captions = (probe.recentCaptions ?? []).filter((c) => c.trim().length > 0);
  if (captions.length > 0) {
    const topics = captions
      .slice(0, 4)
      .map((c) => `\u201C${c.replace(/\s+/g, " ").slice(0, 80)}\u2026\u201D`)
      .join(", ");
    parts.push(`Their recent public posts talk about things like: ${topics}.`);
  }
  return parts.join("\n\n");
}

export default function Onboarding({ onBack }: { onBack: () => void }) {
  const onboarding = useAppStore((s) => s.onboarding);
  const setOnboarding = useAppStore((s) => s.setOnboarding);
  const setStep = useAppStore((s) => s.setStep);

  const [probing, setProbing] = useState(false);
  const [found, setFound] = useState<InstagramProbe | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const set = (p: Partial<OnboardingInput>) => setOnboarding(p);

  async function probeInstagram() {
    const handle = normalizeHandle(onboarding.instagramHandle);
    if (handle.length < 2) {
      toast.error("Enter your Instagram username first, e.g. @yourusername");
      return;
    }
    setProbing(true);
    setFound(null);
    try {
      const res = await apiPost<InstagramProbe>("/api/instagram", { username: handle }, 30000);
      if (res.accessible) {
        setFound(res);
        const autoDescription = onboarding.description.trim() || composeDescription(res);
        set({
          instagramHandle: res.handle ?? handle,
          name: onboarding.name || res.fullName || "",
          followers: onboarding.followers || res.followersText || "",
          description: autoDescription,
        });
        toast.success(
          `Found @${res.handle ?? handle}. We pulled what's public - tweak anything below.`,
        );
      } else {
        toast.info(res.reason ?? "Instagram didn't share this profile. Describe yourself instead.");
        set({ instagramHandle: handle, mode: "describe" });
      }
    } catch (err) {
      toast.info(
        err instanceof Error
          ? `${err.message} No problem - describe yourself instead.`
          : "We couldn't check Instagram right now. Describe yourself instead.",
      );
      set({ mode: "describe" });
    } finally {
      setProbing(false);
    }
  }

  function submit() {
    const hasDescription = onboarding.description.trim().length >= 10;
    const hasHandle = normalizeHandle(onboarding.instagramHandle).length >= 2;
    if (!hasDescription && !hasHandle) {
      toast.error("Add your Instagram username or a few lines about your content to continue.");
      return;
    }
    setStep("analyzing");
  }

  function loadDemo(key: string) {
    const demo = DEMO_PROFILES.find((d) => d.key === key);
    if (!demo) return;
    setOnboarding({ ...demo.input } as Partial<OnboardingInput>);
    setFound(null);
    setDetailsOpen(true);
    toast.success(`${demo.label.split(" · ")[0]}'s profile loaded. Hit "Analyze" to see the magic.`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBFA]">
      <header className="sticky top-0 z-20 glass border-b border-[#EAE5E0]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to home" className="h-11 w-11">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#7655E9] to-[#4931A7]">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="font-semibold text-sm">CreatorOS AI</span>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="animate-fade-up flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge className="mb-4 bg-[#F0ECFF] text-[#4931A7] hover:bg-[#F0ECFF] gap-1.5 h-6">
              <Wand2 className="size-3" /> Step 1 of 3
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#252331]">
              Let&apos;s build your creator business.
            </h1>
            <p className="mt-3 text-[15px] text-[#6E6980] leading-relaxed">
              Start with your Instagram handle or a quick description. Our AI analyses your
              content and finds what your audience would pay for.
            </p>
          </div>
          <div
            aria-hidden="true"
            className="relative hidden h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br from-[#F0ECFF] to-[#FFE4D8] shadow-3d sm:block"
          >
            <Image
              src="/creators/step-scan.png"
              alt=""
              fill
              sizes="112px"
              className="animate-wiggle object-cover"
              priority
            />
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-[#EAE5E0] bg-white shadow-3d-sm p-5 sm:p-6 space-y-6">
          <Tabs
            value={onboarding.mode}
            onValueChange={(v) => set({ mode: v as "instagram" | "describe" })}
          >
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="instagram" className="gap-2">
                <AtSign className="size-4" /> Instagram
              </TabsTrigger>
              <TabsTrigger value="describe" className="gap-2">
                <Sparkles className="size-4" /> Describe yourself
              </TabsTrigger>
            </TabsList>

            <TabsContent value="instagram" className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ig-user">Enter your Instagram username</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8B8694]" />
                    <Input
                      id="ig-user"
                      value={onboarding.instagramHandle}
                      onChange={(e) => set({ instagramHandle: e.target.value })}
                      placeholder="yourusername"
                      className="pl-9 h-11"
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 min-w-11"
                    onClick={probeInstagram}
                    disabled={probing}
                  >
                    {probing ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                    <span className="hidden sm:inline">{probing ? "Checking" : "Find"}</span>
                  </Button>
                </div>
                <p className="text-xs text-[#8B8694]">
                  We&apos;ll try to read your public profile. Instagram restricts automated
                  access, so if it doesn&apos;t work you can describe yourself instead - it
                  takes 30 seconds.
                </p>
              </div>

              {found?.accessible && (
                <div className="rounded-xl border border-[#CDEBDD] bg-[#F2FBF7] p-4 space-y-3 animate-fade-up">
                  <div className="flex items-center gap-3">
                    {found.profilePicUrl ? (
                      <img
                        src={found.profilePicUrl.startsWith("http://")
                          ? found.profilePicUrl.replace("http://", "https://")
                          : found.profilePicUrl}
                        alt={`${found.fullName ?? found.handle} profile`}
                        className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#299D70] to-[#166B4C] text-white text-sm font-bold">
                        {initialsOf(found.fullName ?? onboarding.name ?? "C")}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-[#252331]">
                        <span className="truncate">{found.fullName ?? "@handle"}</span>
                        {found.isVerified ? (
                          <BadgeCheck className="size-4 shrink-0 text-[#299D70]" />
                        ) : (
                          <CheckCircle2 className="size-4 shrink-0 text-[#299D70]" />
                        )}
                      </div>
                      <div className="text-xs text-[#6E6980]">
                        @{found.handle}
                        {found.followersText ? ` · ${found.followersText} followers` : ""}
                        {found.postsCount ? ` · ${found.postsCount} posts` : ""}
                      </div>
                    </div>
                    <span className="ml-auto shrink-0 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#299D70] border border-[#CDEBDD]">
                      {found.source === "scrapecreators" ? "Live data" : "Public data"}
                    </span>
                  </div>
                  {(found.recentCaptions?.length ?? 0) > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#166B4C]/70">
                        Recent posts we can see
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {found.recentCaptions!.slice(0, 3).map((cap, i) => (
                          <span
                            key={i}
                            className="max-w-full truncate rounded-full bg-white/85 border border-[#D6EFE3] px-2.5 py-1 text-[11px] text-[#3B6B54]"
                          >
                            {cap.replace(/\s+/g, " ").slice(0, 56)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-[#166B4C]">
                    We pre-filled your public details below. Edit or add a line so our AI
                    understands you better.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="describe" className="mt-5 space-y-2">
              <Label htmlFor="description">Tell us what you create, teach or talk about.</Label>
              <Textarea
                id="description"
                value={onboarding.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="I create fitness content for working professionals. I share workout routines, nutrition advice and tips for building a healthier lifestyle."
                rows={5}
                className="resize-none text-[15px]"
              />
              <p className="text-xs text-[#8B8694]">
                The more specific you are, the sharper your product ideas will be.
              </p>
            </TabsContent>
          </Tabs>

          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-[#EAE5E0] bg-[#FCFBFA] px-4 py-3 text-sm font-medium text-[#252331] hover:bg-[#F7F4F1] transition min-h-11"
              >
                <span className="flex items-center gap-2">
                  <Info className="size-4 text-[#7655E9]" />
                  Add details for sharper results (optional)
                </span>
                <ChevronDown
                  className={`size-4 text-[#8B8694] transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Creator name</Label>
                  <Input
                    id="name"
                    value={onboarding.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="Aditi Sharma"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="niche">Niche</Label>
                  <Input
                    id="niche"
                    value={onboarding.niche}
                    onChange={(e) => set({ niche: e.target.value })}
                    placeholder="Fitness & Wellness"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="followers">Instagram followers</Label>
                  <Input
                    id="followers"
                    value={onboarding.followers}
                    onChange={(e) => set({ followers: e.target.value })}
                    placeholder="28K"
                    className="h-11"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred language</Label>
                  <Select
                    value={onboarding.language}
                    onValueChange={(v) => set({ language: v as Language })}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Hinglish">Hinglish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="audience">Primary audience</Label>
                  <Input
                    id="audience"
                    value={onboarding.audience}
                    onChange={(e) => set({ audience: e.target.value })}
                    placeholder="Working professionals aged 25-35"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Monetisation experience</Label>
                  <Select
                    value={onboarding.monetisationExp || "never"}
                    onValueChange={(v) => set({ monetisationExp: v })}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never sold anything yet</SelectItem>
                      <SelectItem value="collabs">A few brand collaborations</SelectItem>
                      <SelectItem value="regular">I sell regularly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button
            onClick={submit}
            className="w-full h-12 text-[15px] font-semibold bg-gradient-to-r from-[#7655E9] to-[#4931A7] hover:opacity-90 text-white"
          >
            <Sparkles className="size-4" /> Analyze my creator profile
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-[#D9D3E8] bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8B8694]">
            Just exploring? Try a demo creator
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO_PROFILES.map((d) => (
              <Button
                key={d.key}
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-[#D9D3E8]"
                onClick={() => loadDemo(d.key)}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
