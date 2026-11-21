import {
  BookOpen,
  Crown,
  FileText,
  GraduationCap,
  LayoutTemplate,
  ListChecks,
  PhoneCall,
  Presentation,
  Sparkles,
  Users,
  UsersRound,
  Video,
  type LucideIcon,
} from "lucide-react";

export type ThemeKey = "minimal" | "bold" | "editorial" | "playful";

export interface ThemeDef {
  key: ThemeKey;
  label: string;
  description: string;
  /** Page background + base text classes */
  page: string;
  heading: string;
  body: string;
  /** Stronger text (names, headings) inside cards */
  textStrong: string;
  /** Muted/secondary text */
  textMuted: string;
  /** Product card container */
  card: string;
  /** Overlay applied over the product cover image */
  coverOverlay: string;
  /** Primary CTA button. Uses the --store-accent CSS variable. */
  button: string;
  badge: string;
  sectionTitle: string;
  about: string;
  footer: string;
  /** Where the accent colour shows up */
  accentUsage: "cta" | "price" | "both";
  /** CSS gradient used for the theme-picker swatch */
  previewGradient: string;
  dark: boolean;
}

export const THEMES: Record<ThemeKey, ThemeDef> = {
  minimal: {
    key: "minimal",
    label: "Minimal",
    description: "Clean, premium and elegant",
    page: "bg-[#FCFBFA] text-[#252331]",
    heading: "font-sans font-semibold tracking-tight",
    body: "font-sans",
    textStrong: "text-[#252331]",
    textMuted: "text-[#6E6980]",
    card: "rounded-2xl border border-[#EBE7E2] bg-white shadow-[0_1px_3px_rgba(37,35,49,0.06)] overflow-hidden",
    coverOverlay: "bg-gradient-to-t from-black/25 to-transparent",
    button:
      "rounded-full bg-[var(--store-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90",
    badge: "rounded-full bg-[#F0ECFF] px-2.5 py-1 text-[11px] font-medium text-[#4931A7]",
    sectionTitle: "text-lg font-semibold tracking-tight",
    about: "rounded-2xl border border-[#EBE7E2] bg-white p-5 text-[15px] leading-relaxed text-[#4A4655]",
    footer: "text-xs text-[#8B8694]",
    accentUsage: "both",
    previewGradient: "linear-gradient(135deg,#FCFBFA 0%,#F0ECFF 55%,#7655E9 125%)",
    dark: false,
  },
  bold: {
    key: "bold",
    label: "Bold",
    description: "Vibrant, expressive, energetic",
    page: "bg-gradient-to-b from-[#4931A7] via-[#5B3FC9] to-[#2B1B66] text-white",
    heading: "font-sans font-extrabold tracking-tight",
    body: "font-sans",
    textStrong: "text-white",
    textMuted: "text-white/70",
    card: "rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md overflow-hidden",
    coverOverlay: "bg-gradient-to-t from-black/45 to-transparent",
    button:
      "rounded-full bg-[var(--store-accent)] px-5 py-3 text-sm font-bold text-[#241245] transition hover:brightness-105",
    badge: "rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white",
    sectionTitle: "text-lg font-extrabold",
    about:
      "rounded-3xl border border-white/15 bg-white/10 p-5 text-[15px] leading-relaxed text-white/85 backdrop-blur-md",
    footer: "text-xs text-white/60",
    accentUsage: "both",
    previewGradient: "linear-gradient(135deg,#4931A7,#7655E9 55%,#FF927F 120%)",
    dark: true,
  },
  editorial: {
    key: "editorial",
    label: "Editorial",
    description: "Refined typography, magazine feel",
    page: "bg-[#F7F4EF] text-[#1C1913]",
    heading: "font-serif tracking-tight",
    body: "font-sans",
    textStrong: "text-[#1C1913]",
    textMuted: "text-[#8B8577]",
    card: "overflow-hidden rounded-lg border border-[#E5DFD3] bg-white",
    coverOverlay: "bg-gradient-to-t from-black/30 to-transparent",
    button:
      "rounded-none bg-[#1C1913] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#F7F4EF] transition hover:bg-[var(--store-accent)] hover:text-white",
    badge:
      "rounded-none border border-[#1C1913]/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#1C1913]",
    sectionTitle: "font-serif text-xl",
    about: "border-l-2 border-[var(--store-accent)] bg-white/70 p-5 text-[15px] leading-relaxed text-[#4C4638]",
    footer: "text-[11px] uppercase tracking-[0.14em] text-[#8B8577]",
    accentUsage: "price",
    previewGradient: "linear-gradient(135deg,#F7F4EF,#E8DFC9 55%,#1C1913 130%)",
    dark: false,
  },
  playful: {
    key: "playful",
    label: "Playful",
    description: "Creative gradients, friendly energy",
    page: "bg-[#FFF6EE] text-[#252331]",
    heading: "font-baloo font-bold",
    body: "font-sans",
    textStrong: "text-[#252331]",
    textMuted: "text-[#7A6F66]",
    card: "rounded-3xl border-2 border-[#252331] bg-white shadow-[5px_5px_0_0_#252331] overflow-hidden",
    coverOverlay: "bg-gradient-to-t from-black/20 to-transparent",
    button:
      "rounded-full border-2 border-[#252331] bg-[var(--store-accent)] px-5 py-3 text-sm font-bold text-white shadow-[3px_3px_0_0_#252331] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#252331]",
    badge:
      "rounded-full border-2 border-[#252331] bg-[#FFE4D8] px-2.5 py-0.5 text-[11px] font-bold text-[#252331]",
    sectionTitle: "font-baloo text-xl font-bold",
    about:
      "rounded-3xl border-2 border-[#252331] bg-[#FFF0E4] p-5 text-[15px] leading-relaxed text-[#3B3847] shadow-[4px_4px_0_0_#252331]",
    footer: "text-xs font-semibold text-[#8B8694]",
    accentUsage: "both",
    previewGradient: "linear-gradient(135deg,#FFE4D8,#FF927F 55%,#7655E9 130%)",
    dark: false,
  },
};

export const THEME_LIST: ThemeDef[] = [
  THEMES.minimal,
  THEMES.bold,
  THEMES.editorial,
  THEMES.playful,
];

export const THEME_KEYS: ThemeKey[] = ["minimal", "bold", "editorial", "playful"];

export function isThemeKey(v: string): v is ThemeKey {
  return (THEME_KEYS as string[]).includes(v);
}

export interface AccentDef {
  key: string;
  label: string;
  hex: string;
}

export const ACCENTS: AccentDef[] = [
  { key: "violet", label: "Violet", hex: "#7655E9" },
  { key: "coral", label: "Coral", hex: "#FF927F" },
  { key: "emerald", label: "Emerald", hex: "#299D70" },
  { key: "amber", label: "Amber", hex: "#E8A33D" },
  { key: "rose", label: "Rose", hex: "#E85D9E" },
  { key: "charcoal", label: "Charcoal", hex: "#252331" },
];

export function isAccentHex(v: string): boolean {
  return ACCENTS.some((a) => a.hex.toLowerCase() === v.toLowerCase());
}

export interface CoverGradient {
  bg: string;
  icon: string;
  text: string;
}

/** Deterministic product cover art presets */
export const COVER_GRADIENTS: CoverGradient[] = [
  { bg: "linear-gradient(135deg,#7655E9 0%,#4931A7 100%)", icon: "rgba(255,255,255,0.95)", text: "#FFFFFF" },
  { bg: "linear-gradient(135deg,#FF927F 0%,#E85D9E 100%)", icon: "rgba(255,255,255,0.95)", text: "#FFFFFF" },
  { bg: "linear-gradient(135deg,#299D70 0%,#166B4C 100%)", icon: "rgba(255,255,255,0.95)", text: "#FFFFFF" },
  { bg: "linear-gradient(135deg,#E8A33D 0%,#C2681C 100%)", icon: "rgba(255,255,255,0.95)", text: "#FFFFFF" },
  { bg: "linear-gradient(135deg,#252331 0%,#4931A7 100%)", icon: "rgba(255,255,255,0.95)", text: "#FFFFFF" },
  { bg: "linear-gradient(135deg,#F0ECFF 0%,#CDBCFF 100%)", icon: "#4931A7", text: "#4931A7" },
];

const FORMAT_MAP: Array<[RegExp, LucideIcon]> = [
  [/ebook/i, BookOpen],
  [/guide/i, FileText],
  [/course/i, GraduationCap],
  [/cohort/i, Users],
  [/webinar/i, Video],
  [/consult/i, PhoneCall],
  [/communit/i, UsersRound],
  [/membership/i, Crown],
  [/template/i, LayoutTemplate],
  [/checklist/i, ListChecks],
  [/workshop|session/i, Presentation],
];

export function formatMeta(format: string): { icon: LucideIcon; label: string } {
  for (const [re, icon] of FORMAT_MAP) {
    if (re.test(format)) return { icon, label: format };
  }
  return { icon: Sparkles, label: format || "Digital product" };
}

/**
 * 3D cartoon illustration per product format (generated assets in /public/cartoon).
 * Falls back to the template cards artwork for unknown formats.
 */
export function formatCartoon(format: string): string {
  const f = format.toLowerCase();
  if (f.includes("membership")) return "/cartoon/fmt-membership.png";
  if (f.includes("community")) return "/cartoon/fmt-community.png";
  if (f.includes("consult") || f.includes("coaching")) return "/cartoon/fmt-consult.png";
  if (f.includes("course") || f.includes("cohort")) return "/cartoon/fmt-course.png";
  if (f.includes("webinar") || f.includes("workshop") || f.includes("session"))
    return "/cartoon/fmt-webinar.png";
  if (f.includes("template") || f.includes("checklist")) return "/cartoon/fmt-template.png";
  if (f.includes("ebook")) return "/cartoon/fmt-ebook.png";
  if (f.includes("guide")) return "/cartoon/fmt-guide.png";
  return "/cartoon/fmt-template.png";
}
