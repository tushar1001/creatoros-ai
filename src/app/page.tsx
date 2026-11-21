"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { apiGet } from "@/lib/api";
import type { StorePayload } from "@/lib/types";
import Landing from "@/components/landing/Landing";
import Onboarding from "@/components/onboarding/Onboarding";
import { AnalyzingScreen } from "@/components/intelligence/AnalyzingScreen";
import IntelligenceView from "@/components/intelligence/IntelligenceView";
import ProductLab from "@/components/lab/ProductLab";
import { GeneratingScreen } from "@/components/editor/GeneratingScreen";
import Editor from "@/components/editor/Editor";
import PublishScreen from "@/components/publish/PublishScreen";
import PublicStore from "@/components/public/PublicStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const noopSubscribe = () => () => {};

function getPublicSlug(): string {
  if (typeof window === "undefined") return "";
  const pathMatch = window.location.pathname.match(/^\/store\/([a-z0-9-]+)/i);
  const param = new URLSearchParams(window.location.search).get("store");
  return pathMatch?.[1] ?? param ?? "";
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FCFBFA]">
      <div className="flex h-14 w-14 animate-pulse-soft items-center justify-center rounded-2xl bg-gradient-to-br from-[#7655E9] to-[#4931A7] shadow-lg">
        <Sparkles className="size-7 text-white" />
      </div>
    </div>
  );
}

export default function Page() {
  // Hydration + public-store detection without setState-in-effect.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const publicSlug = useSyncExternalStore(noopSubscribe, getPublicSlug, () => "");
  const [confirmFresh, setConfirmFresh] = useState(false);
  const step = useAppStore((s) => s.step);
  const storeId = useAppStore((s) => s.storeId);

  useEffect(() => {
    if (publicSlug) return;
    // Quietly revalidate an existing editing session against the database.
    const s = useAppStore.getState();
    if (s.storeId) {
      apiGet<StorePayload>(`/api/store/${s.storeId}`)
        .then((d) => {
          const cur = useAppStore.getState();
          cur.setStore(d.store);
          cur.setProducts(d.products);
          cur.setSlug(d.slug);
          cur.setPublished(d.store.status === "published");
        })
        .catch(() => {
          /* keep local state */
        });
    }
  }, [publicSlug]);

  useEffect(() => {
    if (mounted && !publicSlug) {
      window.scrollTo(0, 0);
    }
  }, [step, mounted, publicSlug]);

  if (!mounted) return <Splash />;
  if (publicSlug) return <PublicStore key={publicSlug} slug={publicSlug} />;

  const startFresh = () => {
    useAppStore.getState().resetAll();
    useAppStore.getState().setStep("onboarding");
  };

  switch (step) {
    case "onboarding":
      return <Onboarding onBack={() => useAppStore.getState().setStep("landing")} />;
    case "analyzing":
      return <AnalyzingScreen />;
    case "intelligence":
      return <IntelligenceView />;
    case "lab":
      return <ProductLab />;
    case "generating":
      return <GeneratingScreen />;
    case "editor":
      return <Editor />;
    case "publish":
      return <PublishScreen />;
    case "landing":
    default:
      return (
        <>
          <Landing
            onStart={() => {
              const s = useAppStore.getState();
              if (s.storeId || s.intelligence) {
                setConfirmFresh(true);
              } else {
                s.setStep("onboarding");
              }
            }}
            hasSession={!!storeId}
            onResume={() => {
              const s = useAppStore.getState();
              s.setStep(s.store ? "editor" : s.intelligence ? "lab" : "onboarding");
            }}
          />
          <AlertDialog open={confirmFresh} onOpenChange={setConfirmFresh}>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Start a fresh store?</AlertDialogTitle>
                <AlertDialogDescription>
                  You already have a store in progress. Starting over clears that draft from
                  this device. You can always continue your existing store instead.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-gradient-to-r from-[#7655E9] to-[#4931A7]"
                  onClick={startFresh}
                >
                  Start fresh
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
  }
}
