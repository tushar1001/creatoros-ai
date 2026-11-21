"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Anchors shared by the navbar and footer.
 * Every href points to a real section id rendered in sections.tsx.
 */
export const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#creators", label: "Who it's for" },
  { href: "#examples", label: "Examples" },
] as const;

/** Subtle, performant scroll-into-view entrance. Wraps content once — no layout tricks. */
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

/** Gradient logo tile + wordmark. `size="sm"` is used in the footer. */
export function Logo({ size = "md" }: { size?: "md" | "sm" }) {
  return (
    <a
      href="#top"
      aria-label="CreatorOS AI — back to top"
      className="group inline-flex items-center gap-2.5"
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7655E9] to-[#4931A7] shadow-md shadow-[#7655E9]/25 transition-transform duration-300 group-hover:scale-105",
          size === "sm" ? "h-8 w-8" : "h-9 w-9"
        )}
      >
        <Sparkles
          className={cn("text-white", size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]")}
          aria-hidden="true"
        />
      </span>
      <span
        className={cn(
          "font-extrabold tracking-tight text-[#252331]",
          size === "sm" ? "text-base" : "text-lg"
        )}
      >
        CreatorOS <span className="text-[#7655E9]">AI</span>
      </span>
    </a>
  );
}

/** Consistent section header: eyebrow label, expressive title, optional subtitle. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <FadeUp className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7655E9]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className="mt-3 text-3xl font-extrabold tracking-tight text-[#252331] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-[#6E6980] sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </FadeUp>
  );
}
