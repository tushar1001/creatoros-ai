"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Coins,
  HeartHandshake,
  Pencil,
  Quote,
  Sparkles,
  Target,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAppStore } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { formatFollowers, initialsOf, normalizeHandle } from "@/lib/format";
import type { CreatorIntel } from "@/lib/types";

function ChipEditor({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="bg-[#F0ECFF] text-[#4931A7] gap-1 pr-1.5 h-7"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(items.filter((x) => x !== t))}
              aria-label={`Remove ${t}`}
              className="rounded-full hover:bg-[#4931A7]/10 p-0.5"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {items.length === 0 && <span className="text-xs text-[#8B8694]">None yet</span>}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="h-10"
        />
        <Button variant="outline" size="sm" className="h-10" onClick={add}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

export default function IntelligenceView() {
  const intelligence = useAppStore((s) => s.intelligence);
  const setIntelligence = useAppStore((s) => s.setIntelligence);
  const creatorId = useAppStore((s) => s.creatorId);
  const onboarding = useAppStore((s) => s.onboarding);
  const setStep = useAppStore((s) => s.setStep);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CreatorIntel | null>(null);
  const [answer, setAnswer] = useState("");
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  useEffect(() => {
    if (!intelligence) setStep("onboarding");
  }, []);

  if (!intelligence) return null;
  const c = intelligence.creator;
  const handle = normalizeHandle(onboarding.instagramHandle);

  async function reAnalyze() {
    if (answer.trim().length < 3) {
      toast.error("Type a short answer first.");
      return;
    }
    setReanalyzing(true);
    try {
      const res = await apiPost<{ creatorId: string; intelligence: CreatorIntel }>(
        "/api/analyze",
        {
          creatorId: creatorId ?? undefined,
          description: onboarding.description || undefined,
          instagramHandle: handle || undefined,
          name: onboarding.name || undefined,
          niche: onboarding.niche || undefined,
          followers: onboarding.followers || undefined,
          language: onboarding.language,
          audience: onboarding.audience || undefined,
          monetisationExp: onboarding.monetisationExp || undefined,
          extraContext: answer.trim(),
        },
      );
      setIntelligence(res.intelligence);
      setAnswer("");
      setShowFollowUp(false);
      toast.success("Profile updated with your new details.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Re-analysis failed. Please try again.");
    } finally {
      setReanalyzing(false);
    }
  }

  function saveEdits() {
    if (!draft) return;
    if (!draft.creator.name.trim() || !draft.creator.niche.trim()) {
      toast.error("Name and niche can't be empty.");
      return;
    }
    setIntelligence(draft);
    setEditing(false);
    toast.success("Profile corrected.");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBFA]">
      <header className="sticky top-0 z-20 glass border-b border-[#EAE5E0]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep("onboarding")}
            aria-label="Back to onboarding"
            className="h-11 w-11"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <Badge className="bg-[#F0ECFF] text-[#4931A7] hover:bg-[#F0ECFF] gap-1.5 h-6">
            <Wand2 className="size-3" /> Step 2 of 3 · Creator Intelligence
          </Badge>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* AI summary hero card */}
        <section className="animate-fade-up rounded-2xl p-[1.5px] bg-gradient-to-r from-[#7655E9] via-[#9B7BFF] to-[#FF927F] shadow-[0_4px_24px_rgba(118,85,233,0.18)]">
          <div className="rounded-2xl bg-white p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7655E9] to-[#4931A7] text-white text-lg font-bold">
                {initialsOf(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#252331]">
                    {editing ? (
                      <Input
                        value={draft?.creator.name ?? ""}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, creator: { ...d.creator, name: e.target.value } } : d,
                          )
                        }
                        className="h-9 w-56"
                      />
                    ) : (
                      c.name
                    )}
                  </h1>
                  <Badge className="bg-gradient-to-r from-[#7655E9] to-[#4931A7] text-white gap-1 h-6 hover:from-[#7655E9] hover:to-[#4931A7]">
                    <Sparkles className="size-3" /> AI insight
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-[#6E6980]">
                  {editing ? "Niche:" : ""}{" "}
                  {editing ? (
                    <Input
                      value={draft?.creator.niche ?? ""}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, creator: { ...d.creator, niche: e.target.value } } : d,
                        )
                      }
                      className="mt-1 h-9"
                    />
                  ) : (
                    c.niche
                  )}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-[#F7F5FF] border border-[#E4DBFF] p-4">
              <div className="flex items-center gap-2 text-[#4931A7]">
                <Quote className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">AI summary</span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-[#3B3847]">
                {intelligence.summary}
              </p>
            </div>
          </div>
        </section>

        {/* What you told us */}
        <section className="rounded-2xl border border-[#EAE5E0] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6E6980]">
              What you told us
            </h2>
            <Badge variant="outline" className="h-6 border-[#CDEBDD] text-[#166B4C]">
              Verified
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {onboarding.name && (
              <div className="flex items-center gap-2.5 text-sm">
                <Users className="size-4 text-[#7655E9]" />
                <span className="text-[#8B8694]">Name:</span>
                <span className="font-medium text-[#252331]">{onboarding.name}</span>
              </div>
            )}
            {handle && (
              <div className="flex items-center gap-2.5 text-sm">
                <Users className="size-4 text-[#7655E9]" />
                <span className="text-[#8B8694]">Instagram:</span>
                <span className="font-medium text-[#252331]">@{handle}</span>
              </div>
            )}
            {onboarding.followers && (
              <div className="flex items-center gap-2.5 text-sm">
                <Users className="size-4 text-[#7655E9]" />
                <span className="text-[#8B8694]">Followers:</span>
                <span className="font-medium text-[#252331]">{onboarding.followers}</span>
              </div>
            )}
            {onboarding.audience && (
              <div className="flex items-center gap-2.5 text-sm">
                <Target className="size-4 text-[#7655E9]" />
                <span className="text-[#8B8694]">Audience:</span>
                <span className="font-medium text-[#252331]">{onboarding.audience}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm">
              <Sparkles className="size-4 text-[#7655E9]" />
              <span className="text-[#8B8694]">Language:</span>
              <span className="font-medium text-[#252331]">{onboarding.language}</span>
            </div>
            {onboarding.monetisationExp && (
              <div className="flex items-center gap-2.5 text-sm">
                <Coins className="size-4 text-[#7655E9]" />
                <span className="text-[#8B8694]">Monetisation:</span>
                <span className="font-medium text-[#252331]">{onboarding.monetisationExp}</span>
              </div>
            )}
          </div>
        </section>

        {/* AI insights */}
        <section className="rounded-2xl border border-[#EAE5E0] bg-white p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6E6980]">
              AI-discovered profile
            </h2>
            {editing ? (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-[#299D70] hover:bg-[#23855f] text-white gap-1"
                  onClick={saveEdits}
                >
                  <Check className="size-3.5" /> Save
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 border-[#D9D3E8]"
                onClick={() => {
                  setDraft(JSON.parse(JSON.stringify(intelligence)) as CreatorIntel);
                  setEditing(true);
                }}
              >
                <Pencil className="size-3" /> Correct details
              </Button>
            )}
          </div>

          {!editing ? (
            <>
              <div>
                <Label className="text-xs text-[#8B8694]">Areas of expertise</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.expertise.map((e) => (
                    <Badge key={e} variant="secondary" className="bg-[#F0ECFF] text-[#4931A7] h-7">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
              {c.contentPillars.length > 0 && (
                <div>
                  <Label className="text-xs text-[#8B8694]">Content pillars</Label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.contentPillars.map((e) => (
                      <Badge key={e} variant="outline" className="h-7 border-[#EAE5E0] text-[#3B3847]">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {c.audience.length > 0 && (
                <div>
                  <Label className="text-xs text-[#8B8694] flex items-center gap-1.5">
                    <Target className="size-3.5" /> Likely audience
                  </Label>
                  <ul className="mt-2 space-y-1.5">
                    {c.audience.map((a) => (
                      <li key={a} className="text-sm text-[#3B3847] flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#FF927F]" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {c.audienceProblems.length > 0 && (
                <div>
                  <Label className="text-xs text-[#8B8694] flex items-center gap-1.5">
                    <HeartHandshake className="size-3.5" /> Problems your audience likely has
                  </Label>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {c.audienceProblems.map((p) => (
                      <li
                        key={p}
                        className="rounded-xl bg-[#FFF6EE] border border-[#FFE4D8] px-3 py-2.5 text-sm text-[#3B3847]"
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {intelligence.monetisationOpportunities.length > 0 && (
                <div>
                  <Label className="text-xs text-[#8B8694] flex items-center gap-1.5">
                    <Coins className="size-3.5" /> Monetisation opportunities
                  </Label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {intelligence.monetisationOpportunities.map((o) => (
                      <div
                        key={o.title}
                        className="rounded-xl border border-[#EAE5E0] bg-[#FCFBFA] p-4"
                      >
                        <p className="text-sm font-semibold text-[#252331]">{o.title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-[#6E6980]">
                          {o.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-[#8B8694]">Recommended voice:</span>
                <Badge variant="secondary" className="bg-[#FFE4D8] text-[#8A4B22] h-7">
                  {c.tone}
                </Badge>
                <Badge variant="secondary" className="bg-[#F0ECFF] text-[#4931A7] h-7">
                  {c.language}
                </Badge>
              </div>
            </>
          ) : (
            draft && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs text-[#8B8694]">Areas of expertise</Label>
                  <div className="mt-2">
                    <ChipEditor
                      items={draft.creator.expertise}
                      onChange={(next) =>
                        setDraft({ ...draft, creator: { ...draft.creator, expertise: next } })
                      }
                      placeholder="e.g. Home workouts"
                      addLabel="Add"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[#8B8694]">Audience segments</Label>
                  <div className="mt-2">
                    <ChipEditor
                      items={draft.creator.audience}
                      onChange={(next) =>
                        setDraft({ ...draft, creator: { ...draft.creator, audience: next } })
                      }
                      placeholder="e.g. Busy working professionals"
                      addLabel="Add"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[#8B8694]">Audience problems</Label>
                  <div className="mt-2">
                    <ChipEditor
                      items={draft.creator.audienceProblems}
                      onChange={(next) =>
                        setDraft({ ...draft, creator: { ...draft.creator, audienceProblems: next } })
                      }
                      placeholder="e.g. No time for gym"
                      addLabel="Add"
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </section>

        {/* Follow-up question */}
        {intelligence.needsMoreInfo && intelligence.followUpQuestion && (
          <section className="rounded-2xl border border-[#E4DBFF] bg-[#F7F5FF] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7655E9] to-[#4931A7]">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#4931A7]">One quick question from your AI</p>
                <p className="mt-1 text-[15px] text-[#3B3847]">{intelligence.followUpQuestion}</p>
                {!showFollowUp ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-9 border-[#C9B8FF] text-[#4931A7] hover:bg-[#F0ECFF]"
                    onClick={() => setShowFollowUp(true)}
                  >
                    Answer &amp; sharpen my profile
                  </Button>
                ) : (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here…"
                      rows={3}
                      className="bg-white"
                    />
                    <Button
                      size="sm"
                      className="h-10 bg-gradient-to-r from-[#7655E9] to-[#4931A7] text-white"
                      onClick={reAnalyze}
                      disabled={reanalyzing}
                    >
                      {reanalyzing ? "Re-analyzing…" : "Re-analyze with this info"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <p className="text-center text-xs leading-relaxed text-[#8B8694] max-w-md mx-auto">
          Everything tagged <span className="font-semibold text-[#4931A7]">AI insight</span> is an
          intelligent hypothesis based on what you shared - not verified data. Correct anything
          that feels off.
        </p>
      </main>

      <footer className="sticky bottom-0 border-t border-[#EAE5E0] bg-white/90 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-4xl">
          <Button
            onClick={() => setStep("lab")}
            className="w-full h-12 text-[15px] font-semibold bg-gradient-to-r from-[#7655E9] to-[#4931A7] hover:opacity-90 text-white"
          >
            <Wand2 className="size-4" /> Looks right - find products I can sell
          </Button>
        </div>
      </footer>
    </div>
  );
}
