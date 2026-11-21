"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeUp } from "./shared";

export interface HeroProps {
  onStart: () => void;
  hasSession?: boolean;
  onResume?: () => void;
}

const TRUST_POINTS = ["Free to start", "No credit card needed", "Live in minutes"] as const;

export function Hero({ onStart, hasSession = false, onResume }: HeroProps) {
  return (
    <section className="bg-mesh-brand relative overflow-hidden bg-[#FCFBFA]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-20">
        {/* Copy */}
        <FadeUp>
          <div>
            <Badge
              variant="secondary"
              className="gap-2 rounded-full border border-[#7655E9]/15 px-3.5 py-1.5 text-xs font-semibold shadow-3d-sm sm:text-sm"
            >
              <Sparkles aria-hidden="true" />
              AI-powered creator storefronts · Made for India
            </Badge>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-[#252331] sm:text-5xl lg:text-6xl">
              Turn Your Influence Into{" "}
              <span className="text-gradient-brand">Income.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#6E6980] sm:text-lg">
              You&apos;ve built an audience. Now build a business around it. Let AI
              discover what you can sell, research what competitors charge and create
              your personalised storefront in minutes.
            </p>

            {hasSession ? <ResumeBanner onResume={onResume} /> : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={onStart}
                className="btn-3d h-12 rounded-full px-7 text-base font-semibold"
              >
                Build My Store – It&apos;s Free
                <span aria-hidden="true" className="flex">
                  <ArrowRight />
                </span>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-2 px-7 text-base font-semibold shadow-3d-sm"
              >
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5">
              {TRUST_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#6E6980]"
                >
                  <Check className="h-4 w-4 shrink-0 text-[#299D70]" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </FadeUp>

        {/* Visual */}
        <FadeUp delay={0.12}>
          <HeroCarousel />
        </FadeUp>
      </div>
    </section>
  );
}

/** Shown when a saved onboarding/store draft exists — resumes via onResume. */
function ResumeBanner({ onResume }: { onResume?: () => void }) {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#7655E9]/20 bg-[#F0ECFF] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#7655E9] shadow-sm">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#252331]">Welcome back!</p>
          <p className="text-xs text-[#4931A7]/85 sm:text-sm">
            You have a store in progress.
          </p>
        </div>
      </div>
      <Button
        onClick={() => onResume?.()}
        className="h-11 shrink-0 rounded-full px-5 text-sm font-semibold shadow-md shadow-[#7655E9]/25"
      >
        Continue building
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Creator story carousel                                              */
/* ------------------------------------------------------------------ */

interface HeroSlide {
  key: string;
  name: string;
  niche: string;
  handle: string;
  image: string;
  product: { img: string; name: string; price: string };
  stats: { orders: string; sales: string };
  sparkline: string;
}

const SLIDES: HeroSlide[] = [
  {
    key: "fitness",
    name: "Aditi Sharma",
    niche: "Fitness creator",
    handle: "@fitnesswith.aditi",
    image: "/creators/fitness.png",
    product: { img: "/products/fitness-kit.png", name: "Home Fitness Kit", price: "₹499" },
    stats: { orders: "212", sales: "₹18,420" },
    sparkline: "M0,26 C10,24 14,18 22,18 C30,18 34,10 44,9 C54,8 58,4 68,2 L68,28 L0,28 Z",
  },
  {
    key: "food",
    name: "Meera Iyer",
    niche: "Food creator",
    handle: "@meeras-kitchen",
    image: "/creators/food.png",
    product: { img: "/products/spice-box.png", name: "Masala Dabba Essentials", price: "₹799" },
    stats: { orders: "164", sales: "₹12,880" },
    sparkline: "M0,24 C12,22 16,14 26,13 C36,12 42,16 52,10 C58,6 62,5 68,3 L68,28 L0,28 Z",
  },
  {
    key: "finance",
    name: "Rahul Verma",
    niche: "Finance creator",
    handle: "@rahulmoneytalks",
    image: "/creators/finance.png",
    product: { img: "/products/finance-planner.png", name: "SIP Planner Journal", price: "₹399" },
    stats: { orders: "305", sales: "₹24,640" },
    sparkline: "M0,25 C8,23 12,20 20,17 C30,13 36,12 46,8 C56,5 60,4 68,2 L68,28 L0,28 Z",
  },
  {
    key: "fashion",
    name: "Ananya Rao",
    niche: "Fashion creator",
    handle: "@stylewithananya",
    image: "/creators/fashion.png",
    product: { img: "/products/style-lookbook.png", name: "Festive Style Lookbook", price: "₹599" },
    stats: { orders: "188", sales: "₹15,310" },
    sparkline: "M0,22 C10,20 14,16 24,15 C34,14 40,9 50,8 C58,7 62,4 68,2 L68,28 L0,28 Z",
  },
];

const AUTOPLAY_MS = 5200;

/** Auto-playing, swipeable story-frame carousel of real Indian creator stores. */
function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    if (paused) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(next, AUTOPLAY_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, next]);

  const slide = SLIDES[index];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Real creator store examples"
      className="relative mx-auto w-full max-w-[460px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Ambient gradient blobs */}
      <div aria-hidden="true" className="absolute -left-12 -top-12 h-64 w-64 animate-blob rounded-full bg-[#7655E9]/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-14 -right-10 h-72 w-72 animate-blob rounded-full bg-[#FF927F]/25 blur-3xl [animation-delay:-6s]" />
      <div aria-hidden="true" className="absolute left-1/2 top-1/4 h-56 w-56 animate-blob rounded-full bg-[#F0ECFF] blur-2xl [animation-delay:-11s]" />

      {/* Story frame */}
      <div className="relative z-10 mx-auto w-[290px] rotate-[3deg] transition-transform duration-500 hover:rotate-0 sm:w-[330px]">
        <div
          className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-white bg-[#EDE8FA] shadow-3d"
          style={{ aspectRatio: "4 / 5" }}
        >
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={slide.key}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70) next();
                else if (info.offset.x > 70) prev();
              }}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
            >
              <Image
                src={slide.image}
                alt={`${slide.name}, ${slide.niche} from India, running her creator store`}
                fill
                sizes="(max-width: 640px) 290px, 330px"
                className="object-cover"
                priority={index === 0}
              />
              {/* Readability gradients */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

              {/* Story header */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2.5 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/95 text-[11px] font-extrabold text-[#4931A7] shadow-sm">
                  {slide.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold leading-tight text-white drop-shadow-sm">
                    {slide.name}
                    <span className="ml-1.5 font-medium text-white/75">{slide.handle}</span>
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                    {slide.niche} · India
                  </p>
                </div>
              </div>

              {/* Story actions */}
              <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-center gap-3 text-white/95">
                <Heart className="h-5 w-5 drop-shadow" fill="currentColor" aria-hidden="true" />
                <Send className="h-5 w-5 drop-shadow" aria-hidden="true" />
                <MessageCircle className="h-5 w-5 drop-shadow" aria-hidden="true" />
              </div>

              {/* Shop my store pill */}
              <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-gradient-to-r from-[#FF8A5C] to-[#F2622F] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#F2622F]/35">
                Shop my store
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating product card */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`prod-${slide.key}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="absolute left-0 top-[30%] z-20 hidden -translate-x-3 items-center gap-3 rounded-2xl border border-white/80 bg-white p-2.5 pr-4 shadow-3d-sm sm:flex lg:-left-8"
        >
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F0ECFF]">
            <Image src={slide.product.img} alt="" fill sizes="48px" className="object-cover" />
          </span>
          <span>
            <span className="block text-xs font-bold leading-tight text-[#252331]">
              {slide.product.name}
            </span>
            <span className="mt-0.5 block text-xs font-extrabold text-[#7655E9]">
              {slide.product.price}
            </span>
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Floating sales card */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`stats-${slide.key}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="absolute -bottom-7 right-0 z-20 hidden w-[210px] rounded-2xl border border-white/80 bg-white p-3.5 shadow-3d-sm sm:block lg:-right-6"
        >
          <svg viewBox="0 0 68 28" aria-hidden="true" className="h-9 w-full">
            <defs>
              <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#299D70" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#299D70" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${slide.sparkline}`} fill="url(#spark-fill)" stroke="none" />
            <path
              d={slide.sparkline.replace(/ L68,28 L0,28 Z/, "")}
              fill="none"
              stroke="#299D70"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div className="mt-1 flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium text-[#8B8694]">Orders</p>
              <p className="text-base font-extrabold leading-tight text-[#252331]">
                {slide.stats.orders}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium text-[#8B8694]">Total sales</p>
              <p className="text-base font-extrabold leading-tight text-[#299D70]">
                {slide.stats.sales}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Static AI chip */}
      <div className="absolute -top-5 left-2 z-20 hidden items-center gap-2.5 rounded-2xl border border-white/70 bg-white/85 px-3 py-2.5 shadow-3d-sm backdrop-blur animate-float sm:flex lg:-left-4">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#F0ECFF] text-[#7655E9]">
          <Wand2 className="h-4 w-4" />
        </span>
        <span className="whitespace-nowrap text-xs font-semibold text-[#252331]">
          AI Product Lab · 4 ideas found
        </span>
      </div>

      {/* Controls */}
      <div className="relative z-30 mt-12 flex items-center justify-center gap-2.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            aria-label={`Show ${s.name}'s store example`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={cn(
              "h-2.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7655E9]",
              i === index
                ? "w-7 bg-gradient-to-r from-[#7655E9] to-[#4931A7]"
                : "w-2.5 bg-[#D9D3E8] hover:bg-[#B9AEE0]",
            )}
          />
        ))}
      </div>
    </div>
  );
}
