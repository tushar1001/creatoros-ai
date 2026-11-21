"use client";

import type { JSX } from "react";

import { Hero } from "./hero";
import {
  CreatorCategories,
  FeatureBand,
  FinalCta,
  Footer,
  HowItWorks,
  Navbar,
  NicheMarquee,
  Showcase,
} from "./sections";

export interface LandingProps {
  /** Opens the onboarding flow. */
  onStart: () => void;
  /** True when a saved store exists in localStorage. */
  hasSession?: boolean;
  /** Resumes the saved store. */
  onResume?: () => void;
}

/**
 * CreatorOS AI landing page.
 *
 * Root is a min-h-screen flex column so the footer sticks to the bottom on
 * short pages. The sticky navbar lives outside any overflow-hidden wrapper
 * (overflow on an ancestor would break position: sticky) — horizontal safety
 * is handled locally: the hero clips its own blobs/chips and the marquee and
 * showcase rows scroll within their own containers.
 */
export default function Landing({
  onStart,
  hasSession = false,
  onResume,
}: LandingProps): JSX.Element {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-[#FCFBFA]">
      <Navbar onStart={onStart} />
      <main className="flex-1">
        <Hero onStart={onStart} hasSession={hasSession} onResume={onResume} />
        <NicheMarquee />
        <HowItWorks />
        <CreatorCategories />
        <Showcase />
        <FeatureBand />
        <FinalCta onStart={onStart} />
      </main>
      <Footer onStart={onStart} />
    </div>
  );
}
