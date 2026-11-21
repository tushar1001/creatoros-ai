"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  ExternalLink,
  FlaskConical,
  Globe,
  Info,
  Loader2,
  PackageOpen,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  SearchCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { formatINR, tmpId } from "@/lib/format";
import { COVER_GRADIENTS, formatCartoon } from "@/lib/themes";
import type { CreatorIntel, PricingIntel, ProductDraft } from "@/lib/types";

const PRODUCT_FORMATS = [
  "Ebook",
  "Digital guide",
  "Course",
  "Cohort programme",
  "Webinar",
  "1-on-1 consultation",
  "Paid community",
  "Template pack",
  "Checklist",
  "Workshop",
  "Membership",
];

function confidenceStyle(confidence: string): string {
  if (confidence.toLowerCase().includes("strong")) return "bg-[#E2F3EC] text-[#166B4C]";
  if (confidence.toLowerCase().includes("experimental")) return "bg-[#FFEBE7] text-[#B3402A]";
  return "bg-[#FFE4D8] text-[#8A4B22]";
}

const VERDICT_META: Record<
  PricingIntel["verdict"],
  { label: string; cls: string; icon: typeof BadgeCheck }
> = {
  aligned: { label: "In market range", cls: "bg-[#E2F3EC] text-[#166B4C]", icon: BadgeCheck },
  underpriced: { label: "Below market", cls: "bg-[#FFF3D6] text-[#8A6116]", icon: TrendingUp },
  overpriced: { label: "Above market", cls: "bg-[#FFEBE7] text-[#B3402A]", icon: TrendingDown },
  not_enough_data: { label: "Limited data", cls: "bg-[#F1EDE8] text-[#6E6980]", icon: Info },
};

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs === 1 ? "1 hr ago" : `${hrs} hrs ago`;
}

function aiToDraft(p: {
  name: string;
  format: string;
  priceINR?: number;
  description: string;
  targetAudience?: string;
  problemSolved?: string;
  pricingRationale?: string;
  difficulty?: string;
  launchStrategy?: string;
  confidence?: string;
  whyRecommended?: string[];
}, index: number): ProductDraft {
  return {
    id: tmpId("prod"),
    name: p.name,
    format: p.format,
    priceInr: Math.max(0, Math.round(Number(p.priceINR ?? 499))),
    description: p.description,
    targetAudience: p.targetAudience ?? "",
    problemSolved: p.problemSolved ?? "",
    pricingRationale: p.pricingRationale ?? "",
    difficulty: p.difficulty ?? "Medium",
    launchStrategy: p.launchStrategy ?? "",
    confidence: p.confidence ?? "Moderate hypothesis",
    whyRecommended: Array.isArray(p.whyRecommended) ? p.whyRecommended : [],
    selected: true,
    coverStyle: index % COVER_GRADIENTS.length,
  };
}

export default function ProductLab() {
  const products = useAppStore((s) => s.products);
  const setProducts = useAppStore((s) => s.setProducts);
  const updateProduct = useAppStore((s) => s.updateProduct);
  const removeProduct = useAppStore((s) => s.removeProduct);
  const addProduct = useAppStore((s) => s.addProduct);
  const intelligence = useAppStore((s) => s.intelligence);
  const setStep = useAppStore((s) => s.setStep);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [moreLoading, setMoreLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [altFor, setAltFor] = useState<string | null>(null);
  const [altInstruction, setAltInstruction] = useState("");
  const [pricingLoads, setPricingLoads] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!intelligence) {
      setStep("onboarding");
      return;
    }
    if (useAppStore.getState().products.length === 0) {
      void discover();
    } else {
      // Resume: research pricing for any product still missing live intel.
      schedulePricingResearch(useAppStore.getState().products.filter((p) => !p.pricingIntel));
    }
  }, []);

  async function discover() {
    const intel: CreatorIntel | null = useAppStore.getState().intelligence;
    if (!intel) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ products: Parameters<typeof aiToDraft>[0][] }>(
        "/api/products",
        { intelligence: intel, mode: "batch", count: 3 },
      );
      const drafts = res.products.map((p, i) => aiToDraft(p, i));
      setProducts(drafts);
      schedulePricingResearch(drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  /** Live competitor pricing research via Tavily, staggered per product. */
  function schedulePricingResearch(list: ProductDraft[]) {
    list.forEach((p, i) => {
      setTimeout(() => void researchPricing(p.id), i * 700);
    });
  }

  async function researchPricing(id: string) {
    const intel = useAppStore.getState().intelligence;
    const product = useAppStore.getState().products.find((p) => p.id === id);
    if (!intel || !product) return;
    setPricingLoads((m) => ({ ...m, [id]: true }));
    try {
      const res = await apiPost<{ intel: PricingIntel }>("/api/pricing", {
        name: product.name,
        format: product.format,
        priceInr: product.priceInr,
        niche: intel.creator.niche,
        audienceSegments: intel.creator.audience,
        audienceSize: useAppStore.getState().onboarding.followers || undefined,
      });
      updateProduct(id, { pricingIntel: res.intel });
    } catch {
      /* silent - the panel offers a manual retry */
    } finally {
      setPricingLoads((m) => ({ ...m, [id]: false }));
    }
  }

  async function regenerate(id: string, instruction?: string) {
    const intel = useAppStore.getState().intelligence;
    const product = useAppStore.getState().products.find((p) => p.id === id);
    if (!intel || !product) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await apiPost<{ products: Parameters<typeof aiToDraft>[0][] }>(
        "/api/products",
        {
          intelligence: intel,
          mode: "regenerate",
          original: {
            name: product.name,
            format: product.format,
            priceINR: product.priceInr,
            description: product.description,
            targetAudience: product.targetAudience,
            problemSolved: product.problemSolved,
          },
          instruction: instruction || undefined,
        },
      );
      const next = aiToDraft(res.products[0], product.coverStyle);
      const updated: ProductDraft = { ...next, id: product.id, selected: true, pricingIntel: null };
      updateProduct(id, updated);
      toast.success("Fresh idea generated.");
      setAltFor(null);
      setAltInstruction("");
      schedulePricingResearch([updated]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function generateMore() {
    const intel = useAppStore.getState().intelligence;
    if (!intel) return;
    setMoreLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ products: Parameters<typeof aiToDraft>[0][] }>(
        "/api/products",
        {
          intelligence: intel,
          mode: "more",
          count: 2,
          excludeNames: useAppStore.getState().products.map((p) => p.name),
        },
      );
      const existing = useAppStore.getState().products;
      const drafts = res.products.map((p, i) =>
        aiToDraft(p, (existing.length + i) % COVER_GRADIENTS.length),
      );
      setProducts([...existing, ...drafts]);
      schedulePricingResearch(drafts);
      toast.success("New ideas added to your lab.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setMoreLoading(false);
    }
  }

  function buildStore() {
    const selected = useAppStore.getState().products.filter((p) => p.selected);
    if (selected.length === 0) {
      toast.error("Select at least one product for your store.");
      return;
    }
    setStep("generating");
  }

  const selectedCount = products.filter((p) => p.selected).length;
  const editingProduct = products.find((p) => p.id === editId) ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBFA]">
      <header className="sticky top-0 z-20 glass border-b border-[#EAE5E0]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep("intelligence")}
            aria-label="Back to intelligence"
            className="h-11 w-11"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <Badge className="bg-[#F0ECFF] text-[#4931A7] hover:bg-[#F0ECFF] gap-1.5 h-6">
            <FlaskConical className="size-3" /> Step 3 of 3 · Product Lab
          </Badge>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#252331]">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7655E9] to-[#4931A7]">
                <FlaskConical className="size-5 text-white" />
              </span>
              Your AI Product Lab
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6E6980]">
              Based on your content and audience, here&apos;s what they would likely pay for.
              Prices are AI hypotheses in INR - validate them with your audience before launch.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-11 gap-2 border-[#D9D3E8]"
            onClick={generateMore}
            disabled={moreLoading || loading}
          >
            {moreLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Generate more ideas
          </Button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-[#F3D3D3] bg-white p-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[#6E6980] flex-1 min-w-48">{error}</p>
            <Button size="sm" className="h-9 bg-[#7655E9] hover:bg-[#6247c9] text-white" onClick={discover}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-[#EAE5E0] bg-white overflow-hidden">
                <div className="shimmer-bg h-28" />
                <div className="space-y-3 p-5">
                  <div className="shimmer-bg h-5 w-3/4 rounded-md" />
                  <div className="shimmer-bg h-4 w-full rounded-md" />
                  <div className="shimmer-bg h-4 w-2/3 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 && !error ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#D9D3E8] bg-white p-10 text-center">
            <PackageOpen className="mx-auto size-10 text-[#8B8694]" />
            <p className="mt-3 font-medium text-[#252331]">No product ideas yet</p>
            <Button className="mt-4 h-11 bg-gradient-to-r from-[#7655E9] to-[#4931A7] text-white" onClick={discover}>
              <Sparkles className="size-4" /> Discover products
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {products.map((p) => {
              const grad = COVER_GRADIENTS[p.coverStyle % COVER_GRADIENTS.length];
              return (
                <article
                  key={p.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
                    p.selected
                      ? "border-[#7655E9] shadow-[0_4px_20px_rgba(118,85,233,0.16)]"
                      : "border-[#EAE5E0] shadow-[0_1px_3px_rgba(37,35,49,0.06)] hover:border-[#C9B8FF]"
                  }`}
                >
                  <div className="relative h-32 w-full overflow-hidden" style={{ background: grad.bg }}>
                    <Image
                      src={formatCartoon(p.format)}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
                    <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                      {p.format}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-black/30 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
                      {formatINR(p.priceInr)}
                    </span>
                    {p.selected && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-[#299D70] px-2.5 py-1 text-[11px] font-semibold text-white">
                        In my store
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[16px] font-semibold leading-snug text-[#252331]">
                        {p.name}
                      </h3>
                      <Badge className={`shrink-0 ${confidenceStyle(p.confidence)} border-0`}>
                        {p.confidence}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-[#6E6980] line-clamp-3">
                      {p.description}
                    </p>
                    {p.targetAudience && (
                      <p className="flex items-center gap-1.5 text-xs text-[#8B8694]">
                        <Users className="size-3.5 shrink-0" />
                        <span className="truncate">Best for: {p.targetAudience}</span>
                      </p>
                    )}
                    {p.problemSolved && (
                      <p className="flex items-start gap-1.5 text-xs text-[#8B8694]">
                        <Target className="size-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">Solves: {p.problemSolved}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="h-6 border-[#EAE5E0] text-[11px] text-[#3B3847]">
                        Difficulty: {p.difficulty}
                      </Badge>
                      <Badge variant="outline" className="h-6 border-[#EAE5E0] text-[11px] text-[#3B3847]">
                        {formatINR(p.priceInr)}
                      </Badge>
                    </div>
                    {p.launchStrategy && (
                      <p className="flex items-start gap-1.5 text-xs text-[#8B8694]">
                        <Rocket className="size-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{p.launchStrategy}</span>
                      </p>
                    )}

                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="group/why flex w-full items-center justify-between rounded-lg bg-[#F7F5FF] px-3 py-2.5 text-left text-[13px] font-medium text-[#4931A7] hover:bg-[#F0ECFF] transition min-h-11"
                        >
                          Why AI recommends this
                          <ChevronDown className="size-4 transition-transform group-data-[state=open]/why:rotate-180" />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="mt-2 space-y-1.5 rounded-lg border border-[#E4DBFF] bg-white p-3">
                          {p.whyRecommended.map((w) => (
                            <li key={w} className="flex gap-2 text-[13px] text-[#3B3847]">
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#7655E9]" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>

                    {p.pricingRationale && (
                      <p className="text-[11px] italic leading-relaxed text-[#8B8694]">
                        Pricing: {p.pricingRationale}
                      </p>
                    )}

                    <PricingIntelPanel
                      product={p}
                      loading={!!pricingLoads[p.id]}
                      onRetry={() => researchPricing(p.id)}
                      onApplySuggestion={(price) => {
                        updateProduct(p.id, { priceInr: price });
                        toast.success(`Price updated to ${formatINR(price)}`);
                      }}
                    />

                    {altFor === p.id && (
                      <div className="flex gap-2 animate-fade-up">
                        <Input
                          value={altInstruction}
                          onChange={(e) => setAltInstruction(e.target.value)}
                          placeholder="e.g. make it cheaper and more beginner-friendly"
                          className="h-10"
                        />
                        <Button
                          size="sm"
                          className="h-10 shrink-0 bg-[#7655E9] hover:bg-[#6247c9] text-white"
                          onClick={() => regenerate(p.id, altInstruction)}
                          disabled={busyId === p.id}
                        >
                          {busyId === p.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            "Ask AI"
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 border-t border-[#F1EDE8] pt-3">
                      <label
                        className={`flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                          p.selected
                            ? "bg-[#F0ECFF] text-[#4931A7]"
                            : "bg-[#FCFBFA] text-[#6E6980] hover:bg-[#F7F5FF]"
                        }`}
                      >
                        <Checkbox
                          checked={p.selected}
                          onCheckedChange={(v) => updateProduct(p.id, { selected: v === true })}
                          aria-label={`Add ${p.name} to store`}
                          className="data-[state=checked]:border-[#7655E9] data-[state=checked]:bg-[#7655E9]"
                        />
                        <ShoppingBag className="size-4" />
                        {p.selected ? "In my store" : "Add to my store"}
                      </label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 text-[#6E6980] hover:text-[#7655E9]"
                          aria-label={`Regenerate ${p.name}`}
                          onClick={() => regenerate(p.id)}
                          disabled={busyId === p.id}
                        >
                          {busyId === p.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 text-[#6E6980] hover:text-[#7655E9]"
                          aria-label={`Ask AI for alternatives to ${p.name}`}
                          onClick={() => setAltFor(altFor === p.id ? null : p.id)}
                        >
                          <Sparkles className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 text-[#6E6980] hover:text-[#7655E9]"
                          aria-label={`Edit ${p.name}`}
                          onClick={() => setEditId(p.id)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-[#EAE5E0] bg-white/90 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#252331]">
              {selectedCount} product{selectedCount === 1 ? "" : "s"} selected
            </p>
            <p className="text-xs text-[#8B8694]">You can edit everything later.</p>
          </div>
          <Button
            onClick={buildStore}
            disabled={selectedCount === 0}
            className="h-12 shrink-0 gap-2 bg-gradient-to-r from-[#7655E9] to-[#4931A7] px-5 text-[15px] font-semibold text-white hover:opacity-90"
          >
            <Store className="size-4" /> Build my storefront
          </Button>
        </div>
      </footer>

      {/* Edit product dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto scrollbar-slim sm:max-w-lg">
          {editingProduct && (
            <>
              <DialogHeader>
                <DialogTitle>Edit product</DialogTitle>
                <DialogDescription>
                  Changes apply to your store immediately.
                </DialogDescription>
              </DialogHeader>
              <ProductFormFields
                product={editingProduct}
                onChange={(patch) => updateProduct(editingProduct.id, patch)}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="ghost"
                  className="text-[#D64550] hover:bg-[#FFEBE7] hover:text-[#B3402A]"
                  onClick={() => {
                    removeProduct(editingProduct.id);
                    setEditId(null);
                    toast.success("Product removed.");
                  }}
                >
                  Remove
                </Button>
                <Button
                  className="bg-[#7655E9] hover:bg-[#6247c9] text-white"
                  onClick={() => setEditId(null)}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Shared product field editor (used in the lab dialog and reused patterns). */
export function ProductFormFields({
  product,
  onChange,
}: {
  product: ProductDraft;
  onChange: (patch: Partial<ProductDraft>) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="pf-name">Product name</Label>
        <Input
          id="pf-name"
          value={product.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="h-11"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pf-price">Price (INR)</Label>
          <Input
            id="pf-price"
            type="number"
            min={0}
            value={product.priceInr}
            onChange={(e) => onChange({ priceInr: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Format</Label>
          <Select value={product.format} onValueChange={(v) => onChange({ format: v })}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {PRODUCT_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pf-desc">Description</Label>
        <Textarea
          id="pf-desc"
          value={product.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pf-aud">Target audience</Label>
        <Input
          id="pf-aud"
          value={product.targetAudience}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pf-prob">Problem solved</Label>
        <Input
          id="pf-prob"
          value={product.problemSolved}
          onChange={(e) => onChange({ problemSolved: e.target.value })}
          className="h-11"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live competitor pricing intelligence (Tavily web search + LLM).     */
/* ------------------------------------------------------------------ */

export function PricingIntelPanel({
  product,
  loading,
  onRetry,
  onApplySuggestion,
}: {
  product: ProductDraft;
  loading: boolean;
  onRetry: () => void;
  onApplySuggestion: (price: number) => void;
}) {
  const intel = product.pricingIntel ?? null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#E4DBFF] bg-gradient-to-br from-[#F7F5FF] via-white to-[#FFF4EE]">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-[#4931A7]">
          <SearchCheck className="size-3.5 shrink-0" />
          Live competitor pricing
          <span className="hidden items-center gap-1 rounded-full bg-[#F0ECFF] px-1.5 py-0.5 text-[10px] font-medium text-[#7A5CE0] sm:flex">
            <Globe className="size-2.5" /> web search
          </span>
        </span>
        {intel && !loading && (
          <button
            type="button"
            onClick={onRetry}
            className="flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-[#6E6980] transition hover:bg-white hover:text-[#7655E9]"
          >
            <RefreshCw className="size-3" /> Refresh
          </button>
        )}
      </div>

      {loading ? (
        <div className="px-3 pb-3">
          <div className="space-y-2">
            <div className="shimmer-bg h-4 w-2/3 rounded-md" />
            <div className="shimmer-bg h-11 w-full rounded-lg" />
            <div className="shimmer-bg h-11 w-full rounded-lg" />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#8B8694]">
            <Loader2 className="size-3 animate-spin" />
            Scanning the web for how competitors price this in India...
          </p>
        </div>
      ) : intel ? (
        <div className="space-y-2.5 px-3 pb-3">
          {/* Verdict + market range */}
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const V = VERDICT_META[intel.verdict];
              const VIcon = V.icon;
              return (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${V.cls}`}
                >
                  <VIcon className="size-3" /> {V.label}
                </span>
              );
            })()}
            {intel.marketRange && (
              <span className="rounded-full border border-[#EAE5E0] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#252331]">
                Market: {formatINR(intel.marketRange.min)}&ndash;{formatINR(intel.marketRange.max)}
              </span>
            )}
          </div>
          <p className="text-[12px] leading-relaxed text-[#4A4655]">{intel.verdictNote}</p>

          {/* Real competitor evidence with links */}
          {intel.competitors.length > 0 && (
            <div className="space-y-1.5">
              {intel.competitors.map((c, i) => (
                <a
                  key={`${c.url}-${i}`}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#EAE5E0] bg-white/85 px-2.5 py-2 transition hover:border-[#7655E9]/50 hover:shadow-sm"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[12px] font-medium text-[#252331]">
                      <span className="truncate">{c.name}</span>
                      <ExternalLink className="size-3 shrink-0 text-[#8B8694]" />
                    </span>
                    <span className="mt-0.5 block truncate text-[10.5px] text-[#8B8694]">
                      {c.source}
                      {c.note ? ` · ${c.note}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-bold text-[#4931A7]">
                    {c.priceInr != null ? formatINR(c.priceInr) : "\u2014"}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* AI suggested price */}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#4931A7] to-[#7655E9] p-3 text-white shadow-lg shadow-[#4931A7]/25">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                AI suggested price
              </p>
              <p className="mt-0.5 text-[17px] font-extrabold leading-none">
                {formatINR(intel.suggestedPriceInr)}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/85">
                {intel.suggestedNote}
              </p>
            </div>
            {intel.suggestedPriceInr !== product.priceInr && (
              <Button
                size="sm"
                onClick={() => onApplySuggestion(intel.suggestedPriceInr)}
                className="h-9 shrink-0 rounded-full bg-white px-3 text-[12px] font-bold text-[#4931A7] hover:bg-[#F0ECFF]"
              >
                Use this
              </Button>
            )}
          </div>

          <p className="text-[10px] leading-relaxed text-[#8B8694]">
            Researched {timeAgo(intel.researchedAt)} &middot; Real prices from live web search - a
            starting point to validate, not a guarantee.
          </p>
        </div>
      ) : (
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed border-[#D9D3E8] bg-white/60 px-3 py-2.5 text-left text-[12px] text-[#6E6980] transition hover:border-[#7655E9]/50 hover:text-[#4931A7]"
          >
            <SearchCheck className="size-4 shrink-0" />
            Research competitor prices for this product
          </button>
        </div>
      )}
    </div>
  );
}
