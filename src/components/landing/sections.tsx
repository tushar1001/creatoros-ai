"use client";

import Image from "next/image";
import {
  Brain,
  ChefHat,
  Dumbbell,
  FlaskConical,
  Globe,
  GraduationCap,
  IndianRupee,
  MoonStar,
  Palette,
  Plane,
  Rocket,
  SearchCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FadeUp, Logo, NAV_LINKS, SectionHeading } from "./shared";

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

export function Navbar({ onStart }: { onStart: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#EAE5E0] bg-white/80 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
      >
        <Logo />
        <ul className="hidden items-center gap-1 md:ml-auto md:mr-2 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="flex h-11 items-center rounded-full px-4 text-sm font-medium text-[#6E6980] transition-colors hover:bg-[#F0ECFF] hover:text-[#4931A7]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <Button
          onClick={onStart}
          className="h-11 shrink-0 rounded-full px-5 text-sm font-semibold shadow-md shadow-[#7655E9]/25"
        >
          Build My Store
        </Button>
      </nav>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Niche marquee strip                                                 */
/* ------------------------------------------------------------------ */

const NICHES = [
  "Fitness",
  "Finance",
  "Fashion",
  "Food",
  "Travel",
  "Astrology",
  "Education",
  "Design & Coaching",
  "Wellness",
] as const;

/** Content is rendered exactly twice so the -50% marquee translation loops seamlessly. */
export function NicheMarquee() {
  return (
    <section aria-label="Creator niches supported" className="border-y border-[#EAE5E0]/70 bg-white/60 py-4">
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#FCFBFA] to-transparent sm:w-20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#FCFBFA] to-transparent sm:w-20"
        />
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex items-center">
              {NICHES.map((niche) => (
                <li
                  key={niche}
                  className="mx-2 flex items-center gap-2 whitespace-nowrap rounded-full border border-[#EAE5E0] bg-white px-4 py-1.5 text-sm font-medium text-[#6E6980]"
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#7655E9]/50"
                  />
                  {niche}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

const STEPS: { n: string; img: string; alt: string; title: string; desc: string }[] = [
  {
    n: "01",
    img: "/creators/step-scan.png",
    alt: "Indian creator filming a video with her phone and a ring light",
    title: "Tell us what you create.",
    desc: "Drop your Instagram handle or describe your content in a few lines. No forms, no fuss.",
  },
  {
    n: "02",
    img: "/creators/step-lab.png",
    alt: "Indian creator reviewing product ideas and competitor prices on a laptop",
    title: "Discover what you can sell.",
    desc: "Our AI designs products for your niche and researches real competitor prices on the web, so every rupee is grounded.",
  },
  {
    n: "03",
    img: "/creators/step-store.png",
    alt: "Indian creator showing her live storefront on a phone beside packaged orders",
    title: "Launch your personal storefront.",
    desc: "Get a beautiful, mobile-ready storefront with your own public link to share on Instagram and WhatsApp.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="scroll-mt-24 py-16 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="how-it-works-title"
          eyebrow="How it works"
          title="From follower count to storefront in three steps"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <FadeUp key={step.n} delay={index * 0.08} className="h-full">
              <Card className="card-3d h-full overflow-hidden rounded-3xl border-[#EAE5E0] shadow-3d-sm hover:shadow-3d">
                <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-[#F0ECFF] to-[#FFE4D8]">
                  <Image
                    src={step.img}
                    alt={step.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-4 top-3 select-none text-5xl font-extrabold leading-none tracking-tight text-white drop-shadow-[0_2px_8px_rgba(73,49,167,0.45)]"
                  >
                    {step.n}
                  </span>
                </div>
                <div className="px-6 pb-6 pt-5">
                  <h3 className="text-lg font-bold text-[#252331]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6E6980]">{step.desc}</p>
                </div>
              </Card>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Creator categories                                                  */
/* ------------------------------------------------------------------ */

type CategoryTile = "lavender" | "peach" | "green";

const CATEGORY_TILES: Record<CategoryTile, string> = {
  lavender: "bg-[#F0ECFF] text-[#7655E9]",
  peach: "bg-[#FFE4D8] text-[#D95F3B]",
  green: "bg-[#E2F3EC] text-[#299D70]",
};

const CATEGORIES: { title: string; blurb: string; icon: LucideIcon; tile: CategoryTile }[] = [
  {
    title: "Fitness & Wellness",
    blurb: "Home workouts, yoga flows and diet plans your followers already ask for.",
    icon: Dumbbell,
    tile: "lavender",
  },
  {
    title: "Finance & Investing",
    blurb: "SIPs, tax saving and money basics your audience will pay to learn.",
    icon: IndianRupee,
    tile: "peach",
  },
  {
    title: "Fashion & Beauty",
    blurb: "Style guides, skincare routines and festive lookbooks that convert.",
    icon: ShoppingBag,
    tile: "green",
  },
  {
    title: "Food & Cooking",
    blurb: "Regional recipes and restaurant-style dishes, minus the guesswork.",
    icon: ChefHat,
    tile: "lavender",
  },
  {
    title: "Travel",
    blurb: "Itineraries, budget hacks and hidden gems across India and beyond.",
    icon: Plane,
    tile: "peach",
  },
  {
    title: "Astrology & Spirituality",
    blurb: "Kundli readings, daily horoscopes and guided manifestation journals.",
    icon: MoonStar,
    tile: "green",
  },
  {
    title: "Teaching & Exam Prep",
    blurb: "JEE, NEET and UPSC notes and crash courses students actually finish.",
    icon: GraduationCap,
    tile: "lavender",
  },
  {
    title: "Design & Coaching",
    blurb: "Templates, portfolio reviews and career playbooks that sell.",
    icon: Palette,
    tile: "peach",
  },
];

export function CreatorCategories() {
  return (
    <section
      id="creators"
      aria-labelledby="creators-title"
      className="scroll-mt-24 border-y border-[#EAE5E0]/70 bg-white py-16 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="creators-title"
          eyebrow="Who it's for"
          title="Built for every kind of creator"
        />
        <FadeUp className="mt-12">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {CATEGORIES.map((category) => (
              <div
                key={category.title}
                className="group flex h-full flex-col rounded-2xl border border-[#EAE5E0] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#7655E9]/40 hover:shadow-lg hover:shadow-[#7655E9]/10 sm:p-5"
              >
                <span
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                    CATEGORY_TILES[category.tile]
                  )}
                >
                  <category.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-bold text-[#252331] sm:text-base">
                  {category.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6E6980] sm:text-sm">
                  {category.blurb}
                </p>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sample storefront showcase                                          */
/* ------------------------------------------------------------------ */

function PreviewShell({
  label,
  cardClass,
  children,
}: {
  label: string;
  cardClass: string;
  children: ReactNode;
}) {
  return (
    <figure className="w-64 shrink-0 snap-center lg:w-auto">
      <div className={cn("h-full rounded-[1.75rem] border p-4 shadow-lg shadow-[#4931A7]/10", cardClass)}>
        {children}
      </div>
      <figcaption className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#6E6980]">
        {label}
      </figcaption>
    </figure>
  );
}

function PreviewHeader({
  initials,
  avatarClass,
  name,
  nameClass,
  headline,
  headlineClass,
}: {
  initials: string;
  avatarClass: string;
  name: string;
  nameClass: string;
  headline: string;
  headlineClass: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold",
          avatarClass
        )}
      >
        {initials}
      </span>
      <div className="min-w-0">
        <p className={cn("truncate text-sm font-bold", nameClass)}>{name}</p>
        <p className={cn("truncate text-[11px]", headlineClass)}>{headline}</p>
      </div>
    </div>
  );
}

function PreviewRow({
  name,
  price,
  rowClass,
  priceClass,
}: {
  name: string;
  price: string;
  rowClass: string;
  priceClass: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-xl px-3 py-2.5", rowClass)}>
      <span className="truncate text-xs font-semibold">{name}</span>
      <span className={cn("shrink-0 text-xs font-bold", priceClass)}>{price}</span>
    </div>
  );
}

function PreviewCta({ label, className }: { label: string; className: string }) {
  return (
    <p className={cn("mt-4 rounded-full py-2 text-center text-xs font-bold", className)}>
      {label}
    </p>
  );
}

export function Showcase() {
  return (
    <section
      id="examples"
      aria-labelledby="examples-title"
      className="scroll-mt-24 py-16 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="examples-title"
          eyebrow="Examples"
          title="Real storefronts, minutes apart"
          subtitle="Every store is generated from the creator's own content — then fine-tuned with AI."
        />
        <FadeUp className="mt-12">
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
            {/* (a) Minimal · Finance coach */}
            <PreviewShell label="Minimal · Finance coach" cardClass="border-[#EAE5E0] bg-white">
              <PreviewHeader
                initials="RM"
                avatarClass="bg-[#F0ECFF] text-[#7655E9]"
                name="Rohan Mehta"
                nameClass="text-[#252331]"
                headline="Personal finance, simplified"
                headlineClass="text-[#6E6980]"
              />
              <div className="mt-4 space-y-2">
                <PreviewRow
                  name="SIP Starter Blueprint"
                  price="₹299"
                  rowClass="bg-[#F4F1ED] text-[#252331]"
                  priceClass="text-[#7655E9]"
                />
                <PreviewRow
                  name="Tax-Saving Playbook"
                  price="₹499"
                  rowClass="bg-[#F4F1ED] text-[#252331]"
                  priceClass="text-[#7655E9]"
                />
              </div>
              <PreviewCta label="Start learning" className="bg-[#7655E9] text-white" />
            </PreviewShell>

            {/* (b) Bold · Fitness creator */}
            <PreviewShell
              label="Bold · Fitness creator"
              cardClass="border-[#4931A7]/40 bg-gradient-to-br from-[#7655E9] to-[#4931A7]"
            >
              <PreviewHeader
                initials="AS"
                avatarClass="bg-[#FF927F] text-[#252331]"
                name="Aditi Sharma"
                nameClass="text-white"
                headline="Fitness for busy professionals"
                headlineClass="text-white/70"
              />
              <div className="mt-4 space-y-2">
                <PreviewRow
                  name="6-Week Fat Loss Plan"
                  price="₹599"
                  rowClass="border border-white/15 bg-white/10 text-white"
                  priceClass="text-white"
                />
                <PreviewRow
                  name="High-Protein Desi Recipes"
                  price="₹249"
                  rowClass="border border-white/15 bg-white/10 text-white"
                  priceClass="text-white"
                />
              </div>
              <PreviewCta label="Start today" className="bg-[#FF927F] text-[#252331]" />
            </PreviewShell>

            {/* (c) Editorial · Fashion influencer */}
            <PreviewShell label="Editorial · Fashion influencer" cardClass="border-[#EAE5E0] bg-[#F4F1ED]">
              <PreviewHeader
                initials="MK"
                avatarClass="bg-[#252331] text-white"
                name="Meera Kapoor"
                nameClass="font-serif text-base text-[#252331]"
                headline="Style that tells a story"
                headlineClass="font-serif italic text-[#6E6980]"
              />
              <div className="mt-4 space-y-2">
                <PreviewRow
                  name="Festive Capsule Wardrobe"
                  price="₹399"
                  rowClass="bg-white text-[#252331]"
                  priceClass="text-[#252331]"
                />
                <PreviewRow
                  name="Skincare Routine Guide"
                  price="₹199"
                  rowClass="bg-white text-[#252331]"
                  priceClass="text-[#252331]"
                />
              </div>
              <PreviewCta label="Shop the edit" className="bg-[#252331] text-white" />
            </PreviewShell>
          </div>
          <p className="mt-6 text-center text-sm text-[#6E6980]">
            These are live generated pages — switch themes with one tap.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Feature band                                                        */
/* ------------------------------------------------------------------ */

const FEATURES: { icon: LucideIcon; title: string; desc: string; highlight?: boolean }[] = [
  {
    icon: SearchCheck,
    title: "Live price research",
    desc: "We scan the web for real competitor prices in India, then suggest what YOUR audience would pay.",
    highlight: true,
  },
  {
    icon: FlaskConical,
    title: "AI Product Lab",
    desc: "2–4 personalised product ideas with INR pricing and launch strategy.",
  },
  {
    icon: Brain,
    title: "Creator Intelligence",
    desc: "Understand your audience, their problems and your monetisation angles.",
  },
  {
    icon: Sparkles,
    title: "Creator Copilot",
    desc: "Edit your store by chatting: 'make my bio friendlier' — done.",
  },
  {
    icon: Palette,
    title: "Four store themes",
    desc: "Minimal, Bold, Editorial and Playful — switch instantly.",
  },
  {
    icon: Globe,
    title: "Instant publishing",
    desc: "Your own public link, ready for Instagram and WhatsApp.",
  },
  {
    icon: Smartphone,
    title: "Built for mobile",
    desc: "Looks stunning on the phones your audience actually uses.",
  },
];

export function FeatureBand() {
  return (
    <section aria-labelledby="features-title" className="bg-[#F0ECFF]/40 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="features-title" eyebrow="Features" title="Everything you need to launch" />
        <FadeUp className="mt-12">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "card-3d group flex h-full flex-col rounded-2xl border p-4 transition-shadow duration-300 sm:p-5",
                  feature.highlight
                    ? "border-[#7655E9]/30 bg-gradient-to-br from-[#F7F5FF] via-white to-[#FFF4EE] shadow-3d hover:shadow-3d"
                    : "border-[#EAE5E0] bg-white shadow-sm hover:shadow-lg hover:shadow-[#7655E9]/10"
                )}
              >
                <span
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6",
                    feature.highlight
                      ? "bg-gradient-to-br from-[#7655E9] to-[#4931A7] text-white shadow-3d-sm"
                      : "bg-[#F0ECFF] text-[#7655E9]"
                  )}
                >
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-bold text-[#252331] sm:text-base">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6E6980] sm:text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

export function FinalCta({ onStart }: { onStart: () => void }) {
  return (
    <section aria-labelledby="final-cta-title" className="py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeUp>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7655E9] to-[#4931A7] px-6 py-14 text-center shadow-3d sm:px-12 lg:py-20">
            {/* Decorative glows + sparkles */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-[#FF927F]/25 blur-3xl"
            />
            <Sparkles
              aria-hidden="true"
              className="absolute left-8 top-8 h-5 w-5 text-white/30"
            />
            <Sparkles
              aria-hidden="true"
              className="absolute right-1/4 top-12 h-4 w-4 text-[#FF927F]/70"
            />
            <Sparkles
              aria-hidden="true"
              className="absolute bottom-10 right-10 h-6 w-6 text-white/25"
            />

            {/* Celebration photo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-8 -right-6 hidden h-44 w-44 overflow-hidden rounded-3xl border-4 border-white/40 opacity-90 shadow-3d-sm md:block lg:-right-2"
            >
              <Image
                src="/creators/celebrate.png"
                alt=""
                fill
                sizes="176px"
                className="animate-bounce-soft object-cover"
              />
            </div>

            <h2
              id="final-cta-title"
              className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Your audience is ready. Are you?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
              Launch your creator storefront today — free.
            </p>
            <div className="relative mt-8 flex justify-center">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-base font-bold text-[#7655E9] shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F0ECFF] active:translate-y-0"
              >
                Build My Store – It&apos;s Free
              </button>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export function Footer({ onStart }: { onStart: () => void }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[#EAE5E0] bg-[#FCFBFA]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="max-w-xs">
          <Logo size="sm" />
          <p className="mt-3 text-sm leading-relaxed text-[#6E6980]">
            Your Audience. Your Expertise. Your Business.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-1 gap-y-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex h-11 items-center rounded-full px-4 text-sm font-medium text-[#6E6980] transition-colors hover:bg-[#F0ECFF] hover:text-[#4931A7]"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={onStart}
            className="flex h-11 items-center rounded-full px-4 text-sm font-semibold text-[#7655E9] transition-colors hover:bg-[#F0ECFF] hover:text-[#4931A7]"
          >
            Start building
          </button>
        </nav>

        <div className="md:text-right">
          <p className="text-sm font-semibold text-[#252331]">Made for India&apos;s creators</p>
          <p className="mt-1.5 text-xs text-[#6E6980]">© {year} CreatorOS AI</p>
        </div>
      </div>
    </footer>
  );
}
