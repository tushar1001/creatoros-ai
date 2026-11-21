"use client";

import Image from "next/image";
import {
  Globe,
  Instagram,
  Mail,
  MessageCircle,
  PackageOpen,
  Users,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type * as React from "react";

import { COVER_GRADIENTS, formatCartoon, formatMeta, THEMES, type ThemeDef } from "@/lib/themes";
import type { ProductDraft, StoreDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ---------------------------------- helpers --------------------------------- */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatPrice(priceInr: number): string {
  return INR.format(priceInr);
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Adds a scheme when the stored value is a bare domain (e.g. "youtube.com/x"). */
function ensureUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Accepts "@handle", "handle" or a pasted profile URL; returns the bare handle. */
function instagramHandle(value: string): string {
  const trimmed = value.trim().replace(/^@+/, "");
  const fromUrl = trimmed.match(/instagram\.com\/([A-Za-z0-9_.]+)/i);
  return fromUrl ? fromUrl[1] : trimmed;
}

function instagramUrl(value: string): string {
  return `https://instagram.com/${instagramHandle(value)}`;
}

function whatsappUrl(phone: string, message?: string): string {
  const digits = digitsOnly(phone);
  return message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`;
}

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/** Deterministic cover gradient for a product (negative-safe modulo). */
function coverFor(coverStyle: number) {
  const n = COVER_GRADIENTS.length;
  return COVER_GRADIENTS[((coverStyle % n) + n) % n];
}

/** Where the product CTA sends people, based on the contact channels on file. */
function productCtaHref(
  store: StoreDraft,
  creator: { name: string },
  product: ProductDraft,
): string | null {
  const socials = store.socials;
  if (socials.whatsapp && digitsOnly(socials.whatsapp)) {
    return whatsappUrl(
      socials.whatsapp,
      `Hi ${creator.name}! I'm interested in "${product.name}" (${formatPrice(product.priceInr)}).`,
    );
  }
  if (socials.email) {
    return `mailto:${socials.email.trim()}?subject=${encodeURIComponent(`Interested in: ${product.name}`)}`;
  }
  if (socials.instagram) {
    return instagramUrl(socials.instagram);
  }
  return null;
}

/* --------------------------------- ui bits ---------------------------------- */

interface CircleIconButtonProps {
  href: string;
  label: string;
  dark: boolean;
  children: React.ReactNode;
}

/** Circular 44px icon link used in the social row and the contact strip. */
function CircleIconButton({ href, label, dark, children }: CircleIconButtonProps): React.JSX.Element {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors",
        dark
          ? "border-white/20 text-white hover:bg-white/10"
          : "border-black/10 text-[#252331] hover:bg-black/5",
      )}
    >
      {children}
    </a>
  );
}

interface ProductCardProps {
  store: StoreDraft;
  creator: { name: string };
  product: ProductDraft;
  theme: ThemeDef;
  preview: boolean;
  onProductCta?: (product: ProductDraft) => void;
  /** Above-the-fold cover images should load eagerly (LCP). */
  eager?: boolean;
}

function ProductCard({
  store,
  creator,
  product,
  theme,
  preview,
  onProductCta,
  eager = false,
}: ProductCardProps): React.JSX.Element {
  const gradient = coverFor(product.coverStyle);
  const { label: formatLabel } = formatMeta(product.format);
  const ctaLabel = store.cta.trim() || "Get instant access";
  // In preview mode the CTA stays inside the editor; on the live page it navigates.
  const href = preview ? null : productCtaHref(store, creator, product);
  const ctaClasses = cn(theme.button, "flex min-h-11 w-full items-center justify-center text-center");

  return (
    <article className={cn(theme.card, "group")}>
      {/* Cover art */}
      <div
        className="relative aspect-[16/9] w-full overflow-hidden"
        style={{ background: gradient.bg }}
      >
        <Image
          src={formatCartoon(product.format)}
          alt=""
          fill
          sizes="(max-width: 680px) 100vw, 680px"
          className="object-cover"
          priority={eager}
          loading={eager ? "eager" : "lazy"}
        />
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", theme.coverOverlay)} />
        <span className="absolute bottom-3 left-3 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {formatLabel}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/30 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
          {formatPrice(product.priceInr)}
        </span>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4 sm:p-5">
        <h3 className={cn("text-base font-semibold sm:text-lg", theme.textStrong)}>{product.name}</h3>
        {product.description.trim() ? (
          <p className={cn("line-clamp-3 text-sm leading-relaxed", theme.textMuted)}>{product.description}</p>
        ) : null}
        {product.targetAudience.trim() ? (
          <p className={cn("flex items-center gap-1.5 text-xs", theme.textMuted)}>
            <Users aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">Best for: {product.targetAudience}</span>
          </p>
        ) : null}

        {/* CTA */}
        {href !== null ? (
          <a
            href={href}
            className={ctaClasses}
            {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          >
            {ctaLabel}
          </a>
        ) : (
          <button type="button" onClick={() => onProductCta?.(product)} className={ctaClasses}>
            {ctaLabel}
          </button>
        )}
      </div>
    </article>
  );
}

/* ------------------------------ main component ------------------------------ */

/**
 * Renders a creator's public storefront page and the live preview inside the
 * editor. Pure function of its props (no internal state) so the preview
 * re-renders instantly on every change.
 */
export default function StorefrontView(props: {
  store: StoreDraft;
  products: ProductDraft[];
  creator: { name: string; niche?: string; handle?: string };
  /** true when rendered inside the editor preview (CTA clicks call onProductCta instead of navigating) */
  preview?: boolean;
  /** called when preview=true and a product CTA is clicked */
  onProductCta?: (product: ProductDraft) => void;
  className?: string;
}): React.JSX.Element {
  const { store, products, creator, preview = false, onProductCta, className } = props;

  const theme = THEMES[store.theme];
  const accent = store.accent.trim() || "#7655E9";
  const initials = initialsOf(creator.name);
  const hasProfileImage = store.profileImage.trim().length > 0;

  // Social row: only channels the creator actually filled in.
  const igHandle = instagramHandle(store.socials.instagram || creator.handle || "");
  const waDigits = store.socials.whatsapp ? digitsOnly(store.socials.whatsapp) : "";
  const email = store.socials.email?.trim() ?? "";
  const socialLinks: Array<{ key: string; label: string; href: string; Icon: LucideIcon }> = [];
  if (igHandle) {
    socialLinks.push({ key: "instagram", label: "Instagram", href: instagramUrl(igHandle), Icon: Instagram });
  }
  if (store.socials.youtube?.trim()) {
    socialLinks.push({ key: "youtube", label: "YouTube", href: ensureUrl(store.socials.youtube), Icon: Youtube });
  }
  if (waDigits) {
    socialLinks.push({ key: "whatsapp", label: "WhatsApp", href: whatsappUrl(waDigits), Icon: MessageCircle });
  }
  if (email) {
    socialLinks.push({ key: "email", label: "Email", href: `mailto:${email}`, Icon: Mail });
  }
  if (store.socials.website?.trim()) {
    socialLinks.push({ key: "website", label: "Website", href: ensureUrl(store.socials.website), Icon: Globe });
  }

  return (
    <div
      className={cn(theme.page, theme.body, "min-h-full w-full", className)}
      style={{ "--store-accent": accent } as React.CSSProperties}
    >
      <div className="mx-auto w-full max-w-[680px] space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        {/* 1. Profile header */}
        <header className="space-y-4">
          {hasProfileImage ? (
            <img
              src={store.profileImage}
              alt={creator.name ? `${creator.name} profile photo` : "Creator profile photo"}
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[var(--store-accent)] ring-offset-2 ring-offset-transparent sm:h-18 sm:w-18"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white sm:h-18 sm:w-18 sm:text-xl"
              style={{ background: "linear-gradient(135deg,var(--store-accent),#4931A7)" }}
            >
              {initials}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className={cn("text-xl sm:text-2xl", theme.heading, theme.textStrong)}>{creator.name}</h1>
            {creator.niche ? <span className={theme.badge}>{creator.niche}</span> : null}
          </div>

          {store.headline.trim() ? (
            <p
              className={cn(
                "text-2xl sm:text-3xl",
                theme.heading,
                theme.textStrong,
                "whitespace-pre-line break-words",
              )}
            >
              {store.headline}
            </p>
          ) : null}

          {store.bio.trim() ? (
            <p
              className={cn(
                "max-w-prose text-[15px] leading-relaxed",
                theme.textMuted,
                "whitespace-pre-line break-words",
              )}
            >
              {store.bio}
            </p>
          ) : null}
        </header>

        {/* 2. Social row */}
        {socialLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {socialLinks.map(({ key, label, href, Icon }) => (
              <CircleIconButton key={key} href={href} label={label} dark={theme.dark}>
                <Icon aria-hidden="true" className="size-5" />
              </CircleIconButton>
            ))}
          </div>
        ) : null}

        {/* 3. Products */}
        <section className="space-y-4">
          <h2 className={theme.sectionTitle}>Products</h2>
          {products.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center",
                theme.dark ? "border-white/25" : "border-black/15",
              )}
            >
              <PackageOpen aria-hidden="true" className={cn("size-8", theme.textMuted)} />
              <p className={cn("mt-3 text-sm font-semibold", theme.textStrong)}>Products coming soon</p>
              <p className={cn("mt-1 text-sm", theme.textMuted)}>This creator is setting up shop.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  store={store}
                  creator={creator}
                  product={product}
                  theme={theme}
                  preview={preview}
                  onProductCta={onProductCta}
                  eager={idx === 0}
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. About */}
        {store.about.trim() ? (
          <section className="space-y-4">
            <h2 className={theme.sectionTitle}>About {firstNameOf(creator.name)}</h2>
            <div className={cn(theme.about, "whitespace-pre-line")}>{store.about}</div>
          </section>
        ) : null}

        {/* 5. Contact strip */}
        {waDigits || email ? (
          <div className={cn(theme.card, "flex flex-wrap items-center justify-between gap-3 p-4")}>
            <p className={cn("text-sm", theme.textMuted)}>Have questions? Message me directly.</p>
            <div className="flex gap-2.5">
              {waDigits ? (
                <CircleIconButton href={whatsappUrl(waDigits)} label="Message on WhatsApp" dark={theme.dark}>
                  <MessageCircle aria-hidden="true" className="size-5" />
                </CircleIconButton>
              ) : null}
              {email ? (
                <CircleIconButton href={`mailto:${email}`} label="Send an email" dark={theme.dark}>
                  <Mail aria-hidden="true" className="size-5" />
                </CircleIconButton>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* 6. Footer */}
        <footer className={cn("pb-2 pt-6 text-center", theme.footer)}>
          {creator.name ? <>{creator.name} · </> : null}
          Built with{" "}
          {preview ? (
            <span className="font-semibold">CreatorOS AI</span>
          ) : (
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-opacity hover:opacity-70"
            >
              CreatorOS AI
            </a>
          )}
        </footer>
      </div>
    </div>
  );
}
