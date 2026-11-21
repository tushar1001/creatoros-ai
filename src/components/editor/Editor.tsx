"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CloudOff,
  Eye,
  Loader2,
  Monitor,
  Palette,
  Pencil,
  Redo2,
  Rocket,
  Smartphone,
  Sparkles,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAppStore } from "@/lib/store";
import { apiPatch } from "@/lib/api";
import StorefrontView from "@/components/storefront/StorefrontView";
import { CopilotPanel } from "@/components/editor/CopilotPanel";
import { ContentPanel } from "@/components/editor/ContentPanel";
import { DesignPanel } from "@/components/editor/DesignPanel";

type MobilePanel = null | "content" | "design" | "copilot";

export default function Editor() {
  const store = useAppStore((s) => s.store);
  const products = useAppStore((s) => s.products);
  const storeId = useAppStore((s) => s.storeId);
  const slug = useAppStore((s) => s.slug);
  const published = useAppStore((s) => s.published);
  const saveStatus = useAppStore((s) => s.saveStatus);
  const past = useAppStore((s) => s.past);
  const future = useAppStore((s) => s.future);
  const setStep = useAppStore((s) => s.setStep);
  const setSaveStatus = useAppStore((s) => s.setSaveStatus);
  const setPublished = useAppStore((s) => s.setPublished);
  const patchStore = useAppStore((s) => s.patchStore);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const remapProductId = useAppStore((s) => s.remapProductId);
  const intelligence = useAppStore((s) => s.intelligence);
  const onboarding = useAppStore((s) => s.onboarding);

  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [device, setDevice] = useState<"phone" | "wide">("phone");
  const [publishing, setPublishing] = useState(false);
  const savedOnce = useRef(false);

  // Redirect if editor entered without data.
  useEffect(() => {
    if (!useAppStore.getState().store) {
      setStep(useAppStore.getState().intelligence ? "lab" : "onboarding");
    }
  }, []);

  // Auto-save to the database (debounced).
  useEffect(() => {
    if (!storeId || !store) return;
    const t = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await apiPatch<{ mapping: Array<{ tempId: string; realId: string }> }>(
          `/api/store/${storeId}`,
          { store, products },
        );
        for (const m of res.mapping) {
          if (m.tempId && m.realId) remapProductId(m.tempId, m.realId);
        }
        savedOnce.current = true;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [store, products, storeId]);

  const publish = useCallback(async () => {
    const s = useAppStore.getState();
    if (!s.store || !s.storeId) return;
    setPublishing(true);
    try {
      await apiPatch(`/api/store/${s.storeId}`, {
        store: { ...s.store, status: "published" },
        products: s.products,
      });
      patchStore({ status: "published" });
      setPublished(true);
      setStep("publish");
      toast.success("Your store is live!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publishing failed. Please retry.");
    } finally {
      setPublishing(false);
    }
  }, [patchStore, setPublished, setStep]);

  if (!store) return null;

  const creator = {
    name: intelligence?.creator.name ?? onboarding.name ?? "Creator",
    niche: intelligence?.creator.niche ?? onboarding.niche,
    handle: store.socials.instagram ?? onboarding.instagramHandle.replace(/^@+/, ""),
  };

  const saveIndicator =
    saveStatus === "saving" ? (
      <span className="flex items-center gap-1.5 text-xs text-[#8B8694]">
        <Loader2 className="size-3.5 animate-spin" /> Saving…
      </span>
    ) : saveStatus === "error" ? (
      <span className="flex items-center gap-1.5 text-xs text-[#D64550]">
        <CloudOff className="size-3.5" /> Save failed - retrying on next edit
      </span>
    ) : savedOnce.current || published ? (
      <span className="flex items-center gap-1.5 text-xs text-[#299D70]">
        <Check className="size-3.5" /> Saved
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-xs text-[#8B8694]">
        <Check className="size-3.5" /> Saved
      </span>
    );

  const panels = (
    <>
      <TabsContent value="content" className="mt-0">
        <ContentPanel />
      </TabsContent>
      <TabsContent value="design" className="mt-0">
        <DesignPanel />
      </TabsContent>
    </>
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FCFBFA] lg:h-[100dvh] lg:overflow-hidden">
      {/* Header */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-[#EAE5E0] bg-white px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to product lab"
          onClick={() => setStep("lab")}
          className="h-11 w-11 shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7655E9] to-[#4931A7]">
          <Sparkles className="size-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#252331]">{creator.name}&apos;s store</p>
          <p className="hidden truncate text-[11px] text-[#8B8694] sm:block">
            /store/{slug ?? "…"}
          </p>
        </div>
        <div className="hidden md:block">{saveIndicator}</div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Undo"
            onClick={undo}
            disabled={past.length === 0}
            className="h-11 w-11"
          >
            <Undo2 className="size-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Redo"
            onClick={redo}
            disabled={future.length === 0}
            className="h-11 w-11"
          >
            <Redo2 className="size-4.5" />
          </Button>
        </div>
        {slug && (
          <Button
            variant="outline"
            className="hidden h-11 gap-2 border-[#D9D3E8] sm:inline-flex"
            onClick={() => window.open(`/store/${slug}`, "_blank", "noopener")}
          >
            <Eye className="size-4" /> View live
          </Button>
        )}
        <Button
          onClick={() => void publish()}
          disabled={publishing}
          className="h-11 shrink-0 gap-2 bg-gradient-to-r from-[#7655E9] to-[#4931A7] text-white hover:opacity-90"
        >
          {publishing ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
          {published ? "View publish" : "Publish"}
        </Button>
      </header>

      {/* Desktop 3-column layout */}
      <div className="hidden lg:grid lg:h-[calc(100dvh-3.5rem)] lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[330px_1fr_380px]">
        {/* Left: editing panel */}
        <aside className="overflow-y-auto scrollbar-slim border-r border-[#EAE5E0] bg-white">
          <Tabs defaultValue="content">
            <div className="sticky top-0 z-10 bg-white px-4 pt-3 pb-2">
              <TabsList className="grid w-full grid-cols-2 h-10">
                <TabsTrigger value="content" className="gap-1.5">
                  <Pencil className="size-3.5" /> Content
                </TabsTrigger>
                <TabsTrigger value="design" className="gap-1.5">
                  <Palette className="size-3.5" /> Design
                </TabsTrigger>
              </TabsList>
            </div>
            {panels}
          </Tabs>
        </aside>

        {/* Centre: live preview */}
        <section className="relative bg-[#F1EEE9]" aria-label="Live storefront preview">
          <div className="absolute right-3 top-3 z-10 flex rounded-full border border-[#EAE5E0] bg-white/90 p-1 shadow-sm backdrop-blur">
            <button
              type="button"
              aria-label="Phone preview"
              aria-pressed={device === "phone"}
              onClick={() => setDevice("phone")}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                device === "phone" ? "bg-[#7655E9] text-white" : "text-[#6E6980] hover:bg-[#F4F1ED]"
              }`}
            >
              <Smartphone className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Desktop preview"
              aria-pressed={device === "wide"}
              onClick={() => setDevice("wide")}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                device === "wide" ? "bg-[#7655E9] text-white" : "text-[#6E6980] hover:bg-[#F4F1ED]"
              }`}
            >
              <Monitor className="size-4" />
            </button>
          </div>
          <div className="h-full overflow-y-auto scrollbar-slim px-4 py-6">
            <div
              className={`mx-auto overflow-hidden bg-white transition-all duration-300 ${
                device === "phone"
                  ? "w-full max-w-[420px] rounded-[1.8rem] border-[6px] border-[#252331] shadow-2xl"
                  : "w-full max-w-3xl rounded-2xl border border-[#EAE5E0] shadow-xl"
              }`}
            >
              <StorefrontView
                store={store}
                products={products}
                creator={creator}
                preview
                onProductCta={() =>
                  toast.info("This is a live preview - CTAs go live when you publish.")
                }
              />
            </div>
            <p className="pb-4 pt-3 text-center text-xs text-[#8B8694]">
              Live preview - every edit updates instantly
            </p>
          </div>
        </section>

        {/* Right: Copilot */}
        <aside className="border-l border-[#EAE5E0]">
          <CopilotPanel />
        </aside>
      </div>

      {/* Mobile: full-width preview */}
      <div className="flex-1 bg-[#F1EEE9] lg:hidden">
        <div className="overflow-y-auto scrollbar-slim px-3 pb-24 pt-4">
          <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[1.6rem] border-[5px] border-[#252331] bg-white shadow-xl">
            <StorefrontView
              store={store}
              products={products}
              creator={creator}
              preview
              onProductCta={() =>
                toast.info("This is a live preview - CTAs go live when you publish.")
              }
            />
          </div>
          <p className="pb-2 pt-3 text-center text-xs text-[#8B8694]">
            Live preview - every edit updates instantly
          </p>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EAE5E0] bg-white/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-label="Editor navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 px-3 pt-1.5">
          <button
            type="button"
            onClick={() => setMobilePanel("content")}
            className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[#6E6980] transition hover:bg-[#F7F5FF] hover:text-[#4931A7]"
          >
            <Pencil className="size-5" />
            <span className="text-[11px] font-medium">Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("design")}
            className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[#6E6980] transition hover:bg-[#F7F5FF] hover:text-[#4931A7]"
          >
            <Palette className="size-5" />
            <span className="text-[11px] font-medium">Design</span>
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("copilot")}
            className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[#6E6980] transition hover:bg-[#F7F5FF] hover:text-[#4931A7]"
          >
            <Sparkles className="size-5" />
            <span className="text-[11px] font-medium">Copilot</span>
          </button>
        </div>
      </nav>

      {/* Mobile bottom sheets */}
      <Sheet open={mobilePanel === "content"} onOpenChange={(o) => !o && setMobilePanel(null)}>
        <SheetContent side="bottom" className="h-[88dvh] rounded-t-3xl p-0">
          <SheetHeader className="border-b border-[#EAE5E0] px-4 py-3">
            <SheetTitle className="text-left text-sm">Edit content</SheetTitle>
            <SheetDescription className="sr-only">Edit profile, products and contact links</SheetDescription>
          </SheetHeader>
          <div className="h-[calc(88dvh-4.5rem)] overflow-y-auto scrollbar-slim">
            <ContentPanel />
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={mobilePanel === "design"} onOpenChange={(o) => !o && setMobilePanel(null)}>
        <SheetContent side="bottom" className="h-[88dvh] rounded-t-3xl p-0">
          <SheetHeader className="border-b border-[#EAE5E0] px-4 py-3">
            <SheetTitle className="text-left text-sm">Design</SheetTitle>
            <SheetDescription className="sr-only">Change theme, accent colour and profile image</SheetDescription>
          </SheetHeader>
          <div className="h-[calc(88dvh-4.5rem)] overflow-y-auto scrollbar-slim">
            <DesignPanel />
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={mobilePanel === "copilot"} onOpenChange={(o) => !o && setMobilePanel(null)}>
        <SheetContent side="bottom" className="h-[88dvh] rounded-t-3xl p-0">
          <SheetHeader className="border-b border-[#EAE5E0] px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="size-4 text-[#7655E9]" /> Creator Copilot
            </SheetTitle>
            <SheetDescription className="sr-only">Chat with your AI editing partner</SheetDescription>
          </SheetHeader>
          <div className="h-[calc(88dvh-4.5rem)]">
            <CopilotPanel />
          </div>
        </SheetContent>
      </Sheet>

      {/* Publish-ready hint */}
      {published && (
        <Badge className="fixed left-3 top-16 z-40 bg-[#299D70] text-white" aria-hidden>
          Live
        </Badge>
      )}
    </div>
  );
}
