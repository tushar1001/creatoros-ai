"use client";

import { useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Instagram,
  Mail,
  MessageCircle,
  Palette,
  Plus,
  Trash2,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAppStore } from "@/lib/store";
import { formatINR, tmpId } from "@/lib/format";

/**
 * Left-panel editor: profile copy, products (reorderable) and contact links.
 * History is pushed on the first change per focus session so undo/redo
 * works at a sensible granularity.
 */
export function ContentPanel() {
  const store = useAppStore((s) => s.store);
  const products = useAppStore((s) => s.products);
  const patchStore = useAppStore((s) => s.patchStore);
  const updateProduct = useAppStore((s) => s.updateProduct);
  const removeProduct = useAppStore((s) => s.removeProduct);
  const addProduct = useAppStore((s) => s.addProduct);
  const moveProduct = useAppStore((s) => s.moveProduct);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const commitMap = useRef(new Set<string>());

  const commit = (key: string) => {
    if (!commitMap.current.has(key)) {
      commitMap.current.add(key);
      pushHistory();
    }
  };
  const clearCommits = () => commitMap.current.clear();

  if (!store) return null;

  const setSocial = (key: "instagram" | "youtube" | "whatsapp" | "email" | "website", value: string) => {
    patchStore({ socials: { ...store.socials, [key]: value || undefined } });
  };

  function addNewProduct() {
    pushHistory();
    addProduct({
      id: tmpId("prod"),
      name: "New product",
      format: "Digital guide",
      priceInr: 299,
      description: "",
      targetAudience: "",
      problemSolved: "",
      pricingRationale: "",
      difficulty: "Easy",
      launchStrategy: "",
      confidence: "Moderate hypothesis",
      whyRecommended: [],
      selected: true,
      coverStyle: products.length % 6,
    });
    toast.success("Product added. Fill in the details below.");
  }

  return (
    <div onBlurCapture={clearCommits} className="divide-y divide-[#F1EDE8] px-4 pb-8">
      {/* Profile */}
      <section className="space-y-3.5 py-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8B8694]">Profile</h3>
        <div className="space-y-1.5">
          <Label htmlFor="ed-headline">Headline</Label>
          <Input
            id="ed-headline"
            value={store.headline}
            onChange={(e) => {
              commit("headline");
              patchStore({ headline: e.target.value });
            }}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-bio">Bio</Label>
          <Textarea
            id="ed-bio"
            value={store.bio}
            onChange={(e) => {
              commit("bio");
              patchStore({ bio: e.target.value });
            }}
            rows={3}
            className="resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-about">About section</Label>
          <Textarea
            id="ed-about"
            value={store.about}
            onChange={(e) => {
              commit("about");
              patchStore({ about: e.target.value });
            }}
            rows={5}
            className="resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-cta">CTA button text</Label>
          <Input
            id="ed-cta"
            value={store.cta}
            onChange={(e) => {
              commit("cta");
              patchStore({ cta: e.target.value });
            }}
            className="h-11"
          />
        </div>
      </section>

      {/* Products */}
      <section className="py-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8B8694]">
            Products ({products.length})
          </h3>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 border-[#D9D3E8]" onClick={addNewProduct}>
            <Plus className="size-3.5" /> Add
          </Button>
        </div>
        <Accordion type="multiple" className="mt-3 space-y-2.5">
          {products.map((p, idx) => (
            <AccordionItem
              key={p.id}
              value={p.id}
              className="rounded-xl border border-[#EAE5E0] bg-white px-4 last:border-b"
            >
              <AccordionTrigger className="py-3 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-2 pr-2 text-left">
                  <span className="truncate text-sm font-medium text-[#252331]">{p.name}</span>
                  <span className="shrink-0 rounded-full bg-[#F0ECFF] px-2 py-0.5 text-[11px] font-semibold text-[#4931A7]">
                    {formatINR(p.priceInr)}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3.5 pb-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`p-name-${p.id}`}>Name</Label>
                  <Input
                    id={`p-name-${p.id}`}
                    value={p.name}
                    onChange={(e) => {
                      commit(`name-${p.id}`);
                      updateProduct(p.id, { name: e.target.value });
                    }}
                    className="h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`p-price-${p.id}`}>Price (INR)</Label>
                    <Input
                      id={`p-price-${p.id}`}
                      type="number"
                      min={0}
                      value={p.priceInr}
                      onChange={(e) => {
                        commit(`price-${p.id}`);
                        updateProduct(p.id, { priceInr: Math.max(0, Math.round(Number(e.target.value) || 0)) });
                      }}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`p-format-${p.id}`}>Format</Label>
                    <Input
                      id={`p-format-${p.id}`}
                      value={p.format}
                      onChange={(e) => {
                        commit(`format-${p.id}`);
                        updateProduct(p.id, { format: e.target.value });
                      }}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`p-desc-${p.id}`}>Description</Label>
                  <Textarea
                    id={`p-desc-${p.id}`}
                    value={p.description}
                    onChange={(e) => {
                      commit(`desc-${p.id}`);
                      updateProduct(p.id, { description: e.target.value });
                    }}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`p-aud-${p.id}`}>Target audience</Label>
                  <Input
                    id={`p-aud-${p.id}`}
                    value={p.targetAudience}
                    onChange={(e) => {
                      commit(`aud-${p.id}`);
                      updateProduct(p.id, { targetAudience: e.target.value });
                    }}
                    className="h-10"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Move ${p.name} up`}
                    disabled={idx === 0}
                    onClick={() => {
                      pushHistory();
                      moveProduct(p.id, -1);
                    }}
                    className="h-10 w-10 border-[#EAE5E0]"
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Move ${p.name} down`}
                    disabled={idx === products.length - 1}
                    onClick={() => {
                      pushHistory();
                      moveProduct(p.id, 1);
                    }}
                    className="h-10 w-10 border-[#EAE5E0]"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Change cover style for ${p.name}`}
                    onClick={() => {
                      pushHistory();
                      updateProduct(p.id, { coverStyle: (p.coverStyle + 1) % 6 });
                    }}
                    className="h-10 w-10 border-[#EAE5E0]"
                  >
                    <Palette className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => {
                      pushHistory();
                      removeProduct(p.id);
                      toast.success("Product removed.");
                    }}
                    className="h-10 w-10 text-[#D64550] hover:bg-[#FFEBE7] hover:text-[#B3402A]"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Contact & socials */}
      <section className="space-y-3.5 py-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8B8694]">
          Contact &amp; socials
        </h3>
        <p className="text-xs text-[#8B8694]">
          Shown on your storefront. Product CTAs open WhatsApp or email when set.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="ed-ig" className="flex items-center gap-1.5">
            <Instagram className="size-3.5" /> Instagram username
          </Label>
          <Input
            id="ed-ig"
            value={store.socials.instagram ?? ""}
            onChange={(e) => {
              commit("ig");
              setSocial("instagram", e.target.value);
            }}
            placeholder="yourhandle"
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-yt" className="flex items-center gap-1.5">
            <Youtube className="size-3.5" /> YouTube link
          </Label>
          <Input
            id="ed-yt"
            value={store.socials.youtube ?? ""}
            onChange={(e) => {
              commit("yt");
              setSocial("youtube", e.target.value);
            }}
            placeholder="https://youtube.com/@you"
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-wa" className="flex items-center gap-1.5">
            <MessageCircle className="size-3.5" /> WhatsApp number (with country code)
          </Label>
          <Input
            id="ed-wa"
            value={store.socials.whatsapp ?? ""}
            onChange={(e) => {
              commit("wa");
              setSocial("whatsapp", e.target.value);
            }}
            placeholder="919876543210"
            className="h-11"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-email" className="flex items-center gap-1.5">
            <Mail className="size-3.5" /> Email
          </Label>
          <Input
            id="ed-email"
            value={store.socials.email ?? ""}
            onChange={(e) => {
              commit("email");
              setSocial("email", e.target.value);
            }}
            placeholder="you@example.com"
            className="h-11"
            type="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-web" className="flex items-center gap-1.5">
            <Globe className="size-3.5" /> Website
          </Label>
          <Input
            id="ed-web"
            value={store.socials.website ?? ""}
            onChange={(e) => {
              commit("web");
              setSocial("website", e.target.value);
            }}
            placeholder="https://yourwebsite.com"
            className="h-11"
          />
        </div>
      </section>
    </div>
  );
}
