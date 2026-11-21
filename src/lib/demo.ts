import type { OnboardingInput } from "@/lib/types";

/**
 * Demo creator profiles. These only pre-fill the onboarding form —
 * all AI outputs are still generated live by the LLM.
 */
export const DEMO_PROFILES: Array<{
  key: string;
  label: string;
  emojiHint: string;
  input: Partial<OnboardingInput>;
}> = [
  {
    key: "aditi",
    label: "Aditi · Fitness",
    emojiHint: "demo",
    input: {
      mode: "describe",
      name: "Aditi Sharma",
      niche: "Fitness & Wellness",
      followers: "28K",
      language: "English",
      audience: "Working professionals aged 25-35 in Indian metros",
      monetisationExp: "Never sold a product before",
      description:
        "I create fitness content for working professionals. I share quick home workout routines, simple nutrition tips and habit-building advice for people who sit at a desk all day and want to stay fit without a gym membership.",
    },
  },
  {
    key: "rahul",
    label: "Rahul · Finance",
    emojiHint: "demo",
    input: {
      mode: "describe",
      name: "Rahul Verma",
      niche: "Personal Finance",
      followers: "45K",
      language: "Hinglish",
      audience: "Young professionals starting their investment journey",
      monetisationExp: "Done a few brand collaborations",
      description:
        "I teach personal finance and stock market basics to young professionals in India. I cover SIPs, tax saving, credit card hacks and how to start investing with small amounts. My goal is to make money simple for beginners.",
    },
  },
  {
    key: "meera",
    label: "Meera · Cooking",
    emojiHint: "demo",
    input: {
      mode: "describe",
      name: "Meera Iyer",
      niche: "Food & Cooking",
      followers: "62K",
      language: "English",
      audience: "Busy parents and working professionals who cook at home",
      monetisationExp: "Never sold a product before",
      description:
        "I share quick Indian recipes for busy families - 15-minute dinners, tiffin box ideas for kids and healthy versions of classic dishes. My followers love that every recipe uses everyday ingredients.",
    },
  },
];
