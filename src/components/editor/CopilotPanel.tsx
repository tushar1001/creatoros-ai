"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { apiPost } from "@/lib/api";
import { formatINR } from "@/lib/format";
import type { CopilotAction } from "@/lib/types";

const QUICK_CHIPS = [
  "Make my storefront look more premium",
  "Rewrite my bio in Hinglish",
  "Make product descriptions more persuasive",
  "Suggest a better price",
  "Make the tone more friendly and personal",
  "Add a new ebook to my store",
];

interface PendingPrice {
  productId: string;
  productName: string;
  value: number;
}

export function CopilotPanel() {
  const store = useAppStore((s) => s.store);
  const products = useAppStore((s) => s.products);
  const intelligence = useAppStore((s) => s.intelligence);
  const storeId = useAppStore((s) => s.storeId);
  const copilotHistory = useAppStore((s) => s.copilotHistory);
  const pushCopilotMessage = useAppStore((s) => s.pushCopilotMessage);
  const applyCopilotActions = useAppStore((s) => s.applyCopilotActions);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const updateProduct = useAppStore((s) => s.updateProduct);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingPrice[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [copilotHistory.length, loading, pending.length]);

  async function send(message?: string) {
    const msg = (message ?? input).trim();
    if (!msg || loading || !store) return;
    setInput("");
    pushCopilotMessage({ role: "user", content: msg });
    setLoading(true);
    try {
      const res = await apiPost<{ reply: string; actions: CopilotAction[] }>("/api/copilot", {
        storeId: storeId ?? undefined,
        creator: {
          name: intelligence?.creator.name ?? "Creator",
          niche: intelligence?.creator.niche ?? "",
          language: intelligence?.creator.language ?? "English",
          tone: intelligence?.creator.tone,
        },
        store,
        products,
        history: copilotHistory.slice(-8),
        message: msg,
      });
      pushCopilotMessage({ role: "assistant", content: res.reply });

      const priceActions = res.actions.filter(
        (a): a is Extract<CopilotAction, { type: "updateProduct" }> =>
          a.type === "updateProduct" && a.field === "priceInr" && a.requiresConfirmation === true,
      );
      const newPending: PendingPrice[] = priceActions
        .filter((a) => products.some((p) => p.id === a.productId))
        .map((a) => ({
          productId: a.productId,
          productName: products.find((p) => p.id === a.productId)?.name ?? "Product",
          value: Math.max(0, Math.round(Number(a.value) || 0)),
        }));

      applyCopilotActions(res.actions);
      if (newPending.length > 0) setPending((prev) => [...prev, ...newPending]);
    } catch (err) {
      pushCopilotMessage({
        role: "assistant",
        content:
          err instanceof Error
            ? `I couldn't do that just now: ${err.message}`
            : "I couldn't do that just now. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  function applyPrice(item: PendingPrice) {
    pushHistory();
    updateProduct(item.productId, { priceInr: item.value });
    setPending((prev) => prev.filter((p) => p.productId !== item.productId || p.value !== item.value));
    toast.success(`${item.productName} price updated to ${formatINR(item.value)}`);
  }

  function discardPrice(item: PendingPrice) {
    setPending((prev) => prev.filter((p) => p.productId !== item.productId || p.value !== item.value));
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#EAE5E0] px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7655E9] to-[#4931A7]">
          <Sparkles className="size-4.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#252331]">Creator Copilot</p>
          <p className="flex items-center gap-1.5 text-[11px] text-[#8B8694]">
            <span className="inline-block size-1.5 rounded-full bg-[#299D70]" />
            Your AI editing partner
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-slim px-4 py-4 space-y-4">
        <div className="flex gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7655E9] to-[#4931A7]">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-[#F7F5FF] border border-[#E4DBFF] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#3B3847]">
            Hi{intelligence?.creator.name ? ` ${intelligence.creator.name.split(" ")[0]}` : ""}! I&apos;m
            your Creator Copilot. Tell me what to change - like &quot;make my bio friendlier&quot;,
            &quot;suggest a better price&quot; or &quot;make my store look luxury&quot; - and I&apos;ll
            update your store instantly.
          </div>
        </div>

        {copilotHistory.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-2.5"}>
            {m.role === "assistant" && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7655E9] to-[#4931A7]">
                <Sparkles className="size-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "rounded-tr-sm bg-[#7655E9] text-white"
                  : "rounded-tl-sm bg-white border border-[#EAE5E0] text-[#3B3847]"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Pending price confirmations */}
        {pending.map((p, i) => (
          <div key={`pending-${p.productId}-${i}`} className="ml-9 animate-fade-up">
            <div className="rounded-xl border border-[#FFE4D8] bg-[#FFF6EE] p-3">
              <p className="text-[13px] font-medium text-[#252331]">
                Price change: {p.productName} → {formatINR(p.value)}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  className="h-9 bg-[#299D70] hover:bg-[#23855f] text-white"
                  onClick={() => applyPrice(p)}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 border-[#EAE5E0]"
                  onClick={() => discardPrice(p)}
                >
                  Discard
                </Button>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7655E9] to-[#4931A7]">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white border border-[#EAE5E0] px-3.5 py-3">
              <div className="flex gap-1">
                <span className="size-1.5 animate-pulse-soft rounded-full bg-[#7655E9]" />
                <span className="size-1.5 animate-pulse-soft rounded-full bg-[#7655E9] [animation-delay:0.3s]" />
                <span className="size-1.5 animate-pulse-soft rounded-full bg-[#7655E9] [animation-delay:0.6s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick chips */}
      <div className="border-t border-[#F1EDE8] px-4 pt-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => void send(chip)}
              disabled={loading}
              className="shrink-0 rounded-full border border-[#D9D3E8] bg-[#FCFBFA] px-3 py-1.5 text-xs font-medium text-[#4931A7] transition hover:bg-[#F0ECFF] disabled:opacity-50 min-h-9"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 pb-4 pt-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Tell me what to change…"
          rows={1}
          className="min-h-11 resize-none py-2.5"
          disabled={!store}
        />
        <Button
          size="icon"
          aria-label="Send to Copilot"
          onClick={() => void send()}
          disabled={loading || !input.trim() || !store}
          className="h-11 w-11 shrink-0 bg-gradient-to-br from-[#7655E9] to-[#4931A7] text-white hover:opacity-90"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
