"use client";

import { useEffect, useState } from "react";
import { Instagram, Mail, MessageCircle, Store, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiGet } from "@/lib/api";
import { formatINR } from "@/lib/format";
import StorefrontView from "@/components/storefront/StorefrontView";
import type { ProductDraft, StorePayload } from "@/lib/types";

export default function PublicStore({ slug }: { slug: string }) {
  const [data, setData] = useState<StorePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enquiry, setEnquiry] = useState<ProductDraft | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<StorePayload>(`/api/store/${slug}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load this store.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCFBFA] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#EAE5E0] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F1ED]">
            <TriangleAlert className="size-6 text-[#8B8694]" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-[#252331]">Store not found</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6980]">{error}</p>
          <Button
            className="mt-6 h-11 w-full gap-2 bg-gradient-to-r from-[#7655E9] to-[#4931A7] text-white hover:opacity-90"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            <Store className="size-4" /> Build your own store - it&apos;s free
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCFBFA]">
        <div className="w-full max-w-[380px] px-4">
          <div className="rounded-[1.8rem] border-[6px] border-[#252331] bg-white shadow-2xl">
            <div className="space-y-4 p-6">
              <div className="mx-auto shimmer-bg h-16 w-16 rounded-full" />
              <div className="shimmer-bg h-5 w-3/4 rounded-md" />
              <div className="shimmer-bg h-3 w-full rounded-md" />
              <div className="shimmer-bg h-40 w-full rounded-xl" />
              <div className="shimmer-bg h-11 w-full rounded-full" />
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-[#8B8694]">Loading storefront…</p>
        </div>
      </div>
    );
  }

  const whatsappDigits = data.store.socials.whatsapp?.replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-[#FCFBFA]">
      {data.store.status !== "published" && (
        <div className="bg-[#FFF6EE] px-4 py-2.5 text-center text-xs font-medium text-[#8A4B22]">
          Preview mode - this store hasn&apos;t been published yet.
        </div>
      )}
      <StorefrontView
        store={data.store}
        products={data.products}
        creator={data.creator}
        onProductCta={(product) => setEnquiry(product)}
      />

      <Dialog open={!!enquiry} onOpenChange={(open) => !open && setEnquiry(null)}>
        <DialogContent className="sm:max-w-sm">
          {enquiry && (
            <>
              <DialogHeader>
                <DialogTitle className="text-left">{enquiry.name}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-[#6E6980]">
                {formatINR(enquiry.priceInr)} · {enquiry.format}
              </p>
              <div className="mt-1 space-y-2">
                {whatsappDigits && (
                  <Button asChild className="h-11 w-full gap-2 bg-[#299D70] text-white hover:bg-[#23855f]">
                    <a
                      href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                        `Hi ${data.creator.name}! I'm interested in "${enquiry.name}" (${formatINR(enquiry.priceInr)}).`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="size-4" /> Message on WhatsApp
                    </a>
                  </Button>
                )}
                {data.store.socials.email && (
                  <Button asChild variant="outline" className="h-11 w-full gap-2 border-[#EAE5E0]">
                    <a href={`mailto:${data.store.socials.email}?subject=${encodeURIComponent(`Interested in: ${enquiry.name}`)}`}>
                      <Mail className="size-4" /> Send an email
                    </a>
                  </Button>
                )}
                {data.store.socials.instagram && (
                  <Button asChild variant="outline" className="h-11 w-full gap-2 border-[#EAE5E0]">
                    <a
                      href={`https://instagram.com/${data.store.socials.instagram.replace(/^@+/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="size-4" /> DM on Instagram
                    </a>
                  </Button>
                )}
                {!whatsappDigits && !data.store.socials.email && !data.store.socials.instagram && (
                  <p className="rounded-xl bg-[#F4F1ED] px-4 py-3 text-sm leading-relaxed text-[#6E6980]">
                    This creator hasn&apos;t added contact details yet. Check back soon!
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
