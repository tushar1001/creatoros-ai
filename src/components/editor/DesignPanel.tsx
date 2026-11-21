"use client";

import { Check, ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { ACCENTS, THEME_LIST } from "@/lib/themes";

export function DesignPanel() {
  const store = useAppStore((s) => s.store);
  const patchStore = useAppStore((s) => s.patchStore);
  const pushHistory = useAppStore((s) => s.pushHistory);

  if (!store) return null;

  return (
    <div className="divide-y divide-[#F1EDE8] px-4 pb-8">
      {/* Themes */}
      <section className="space-y-3.5 py-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8B8694]">Store theme</h3>
        <div className="grid grid-cols-2 gap-3">
          {THEME_LIST.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                if (store.theme !== t.key) {
                  pushHistory();
                  patchStore({ theme: t.key });
                }
              }}
              aria-pressed={store.theme === t.key}
              className={`group overflow-hidden rounded-2xl border text-left transition-all min-h-24 ${
                store.theme === t.key
                  ? "border-[#7655E9] ring-2 ring-[#7655E9]/30 shadow-[0_4px_16px_rgba(118,85,233,0.18)]"
                  : "border-[#EAE5E0] hover:border-[#C9B8FF]"
              }`}
            >
              <div className="h-16 w-full" style={{ background: t.previewGradient }} />
              <div className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-[13px] font-semibold text-[#252331]">{t.label}</p>
                  <p className="text-[10px] leading-tight text-[#8B8694]">{t.description}</p>
                </div>
                {store.theme === t.key && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7655E9]">
                    <Check className="size-3 text-white" />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[#8B8694]">
          <Sparkles className="mt-0.5 size-3 shrink-0 text-[#7655E9]" />
          Tip: ask the Copilot things like &quot;give my store a luxury aesthetic&quot; and it will
          pick a theme and rewrite the copy for you.
        </p>
      </section>

      {/* Accent colour */}
      <section className="space-y-3.5 py-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8B8694]">Accent colour</h3>
        <div className="flex flex-wrap gap-2.5">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              aria-label={`Accent colour ${a.label}`}
              aria-pressed={store.accent.toLowerCase() === a.hex.toLowerCase()}
              onClick={() => {
                if (store.accent.toLowerCase() !== a.hex.toLowerCase()) {
                  pushHistory();
                  patchStore({ accent: a.hex });
                }
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                store.accent.toLowerCase() === a.hex.toLowerCase()
                  ? "ring-2 ring-[#252331] ring-offset-2"
                  : "ring-1 ring-black/10 hover:scale-105"
              }`}
              style={{ backgroundColor: a.hex }}
            >
              {store.accent.toLowerCase() === a.hex.toLowerCase() && (
                <Check className="size-4 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Profile image */}
      <section className="space-y-3.5 py-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8B8694]">Profile image</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#EAE5E0] bg-[#F4F1ED]">
            {store.profileImage ? (
              <img src={store.profileImage} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="size-5 text-[#8B8694]" />
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="ed-img" className="sr-only">
              Profile image URL
            </Label>
            <Input
              id="ed-img"
              value={store.profileImage}
              onChange={(e) => patchStore({ profileImage: e.target.value })}
              placeholder="Paste an image URL…"
              className="h-10"
            />
            {store.profileImage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-[#D64550] hover:bg-[#FFEBE7] hover:text-[#B3402A]"
                onClick={() => patchStore({ profileImage: "" })}
              >
                Remove image
              </Button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-[#8B8694]">
          No image? Your initials avatar looks great too.
        </p>
      </section>
    </div>
  );
}
