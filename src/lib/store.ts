"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ChatMessage,
  CopilotAction,
  CreatorIntel,
  OnboardingInput,
  ProductDraft,
  Step,
  StoreDraft,
} from "@/lib/types";
import { isThemeKey } from "@/lib/themes";
import { tmpId } from "@/lib/format";

interface Snapshot {
  store: StoreDraft | null;
  products: ProductDraft[];
}

interface AppState {
  step: Step;
  creatorId: string | null;
  onboarding: OnboardingInput;
  intelligence: CreatorIntel | null;
  extraContext: string;
  products: ProductDraft[];
  store: StoreDraft | null;
  storeId: string | null;
  slug: string | null;
  published: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  copilotHistory: ChatMessage[];
  past: Snapshot[];
  future: Snapshot[];

  setStep: (s: Step) => void;
  setOnboarding: (p: Partial<OnboardingInput>) => void;
  setCreatorId: (id: string | null) => void;
  setIntelligence: (i: CreatorIntel | null) => void;
  setExtraContext: (s: string) => void;
  setProducts: (p: ProductDraft[]) => void;
  updateProduct: (id: string, patch: Partial<ProductDraft>) => void;
  addProduct: (p: ProductDraft) => void;
  removeProduct: (id: string) => void;
  moveProduct: (id: string, dir: -1 | 1) => void;
  remapProductId: (tempId: string, realId: string) => void;
  setStore: (s: StoreDraft | null) => void;
  patchStore: (p: Partial<StoreDraft>, record?: boolean) => void;
  setStoreId: (id: string | null) => void;
  setSlug: (slug: string | null) => void;
  setPublished: (v: boolean) => void;
  setSaveStatus: (v: "idle" | "saving" | "saved" | "error") => void;
  pushCopilotMessage: (m: ChatMessage) => void;
  clearHistoryStacks: () => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  applyCopilotActions: (actions: CopilotAction[]) => string[];
  resetAll: () => void;
}

const emptyOnboarding: OnboardingInput = {
  mode: "describe",
  instagramHandle: "",
  description: "",
  name: "",
  niche: "",
  followers: "",
  language: "English",
  audience: "",
  monetisationExp: "",
};

const TRANSIENT_STEPS: Step[] = ["analyzing", "generating"];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      step: "landing",
      creatorId: null,
      onboarding: emptyOnboarding,
      intelligence: null,
      extraContext: "",
      products: [],
      store: null,
      storeId: null,
      slug: null,
      published: false,
      saveStatus: "idle",
      copilotHistory: [],
      past: [],
      future: [],

      setStep: (s) => set({ step: s }),
      setOnboarding: (p) => set({ onboarding: { ...get().onboarding, ...p } }),
      setCreatorId: (id) => set({ creatorId: id }),
      setIntelligence: (i) => set({ intelligence: i }),
      setExtraContext: (s) => set({ extraContext: s }),
      setProducts: (p) => set({ products: p }),

      updateProduct: (id, patch) =>
        set({
          products: get().products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }),
      addProduct: (p) => set({ products: [...get().products, p] }),
      removeProduct: (id) => set({ products: get().products.filter((p) => p.id !== id) }),
      moveProduct: (id, dir) => {
        const products = [...get().products];
        const idx = products.findIndex((p) => p.id === id);
        const target = idx + dir;
        if (idx === -1 || target < 0 || target >= products.length) return;
        const [item] = products.splice(idx, 1);
        products.splice(target, 0, item);
        set({ products });
      },
      remapProductId: (tempIdStr, realId) => {
        set({ products: get().products.map((p) => (p.id === tempIdStr ? { ...p, id: realId } : p)) });
      },

      setStore: (s) => set({ store: s }),
      patchStore: (p, record = false) => {
        const current = get();
        if (record && current.store) {
          set({
            past: [...current.past.slice(-24), { store: current.store, products: current.products }],
            future: [],
            store: { ...current.store, ...p },
          });
        } else if (current.store) {
          set({ store: { ...current.store, ...p } });
        }
      },

      setStoreId: (id) => set({ storeId: id }),
      setSlug: (slug) => set({ slug }),
      setPublished: (v) => set({ published: v }),
      setSaveStatus: (v) => set({ saveStatus: v }),

      pushCopilotMessage: (m) => set({ copilotHistory: [...get().copilotHistory.slice(-40), m] }),

      clearHistoryStacks: () => set({ past: [], future: [] }),
      pushHistory: () => {
        const current = get();
        set({
          past: [...current.past.slice(-24), { store: current.store, products: current.products }],
          future: [],
        });
      },
      undo: () => {
        const current = get();
        const prev = current.past[current.past.length - 1];
        if (!prev) return;
        set({
          past: current.past.slice(0, -1),
          future: [{ store: current.store, products: current.products }, ...current.future.slice(0, 24)],
          store: prev.store,
          products: prev.products,
        });
      },
      redo: () => {
        const current = get();
        const next = current.future[0];
        if (!next) return;
        set({
          future: current.future.slice(1),
          past: [...current.past, { store: current.store, products: current.products }],
          store: next.store,
          products: next.products,
        });
      },

      /**
       * Apply copilot actions to the underlying data.
       * Returns the ids of products that require confirmation (price changes).
       */
      applyCopilotActions: (actions) => {
        const pending: string[] = [];
        const current = get();
        const nextStore = { ...current.store };
        let products = [...current.products];

        for (const a of actions) {
          if (a.type === "updateStore" && nextStore) {
            if (a.field === "theme" && !isThemeKey(a.value)) continue;
            (nextStore as Record<string, unknown>)[a.field] = a.value;
          } else if (a.type === "updateProduct") {
            const idx = products.findIndex((p) => p.id === a.productId);
            if (idx === -1) continue;
            if (a.requiresConfirmation) {
              pending.push(a.productId);
              continue;
            }
            const patch: Partial<ProductDraft> =
              a.field === "priceInr"
                ? { priceInr: Math.max(0, Math.round(Number(a.value) || 0)) }
                : { [a.field]: String(a.value) };
            products[idx] = { ...products[idx], ...patch };
          } else if (a.type === "addProduct") {
            const p = a.product;
            products.push({
              id: tmpId("prod"),
              name: p.name || "New product",
              format: p.format || "Digital guide",
              priceInr: Math.max(0, Math.round(Number(p.priceINR ?? p.priceInr ?? 499))),
              description: p.description || "",
              targetAudience: p.targetAudience || "",
              problemSolved: p.problemSolved || "",
              pricingRationale: p.pricingRationale || "",
              difficulty: p.difficulty || "Easy",
              launchStrategy: p.launchStrategy || "",
              confidence: p.confidence || "Moderate hypothesis",
              whyRecommended: Array.isArray(p.whyRecommended) ? p.whyRecommended : [],
              selected: true,
              coverStyle: Math.floor(Math.random() * 6),
            });
          }
        }

        set({
          store: nextStore as StoreDraft | null,
          products,
          past: [...current.past.slice(-24), { store: current.store, products: current.products }],
          future: [],
        });
        return pending;
      },

      resetAll: () =>
        set({
          step: "landing",
          creatorId: null,
          onboarding: emptyOnboarding,
          intelligence: null,
          extraContext: "",
          products: [],
          store: null,
          storeId: null,
          slug: null,
          published: false,
          saveStatus: "idle",
          copilotHistory: [],
          past: [],
          future: [],
        }),
    }),
    {
      name: "creatoros-ai-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Transient loading steps are mapped back to their stable source step.
        step: state.step === "analyzing" ? "intelligence" : state.step === "generating" ? "lab" : state.step,
        creatorId: state.creatorId,
        onboarding: state.onboarding,
        intelligence: state.intelligence,
        products: state.products,
        store: state.store,
        storeId: state.storeId,
        slug: state.slug,
        published: state.published,
        copilotHistory: state.copilotHistory,
      }),
    },
  ),
);
