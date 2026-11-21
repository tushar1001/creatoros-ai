import type { Metadata, Viewport } from "next";
import { Baloo_2, Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo2",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CreatorOS AI - Turn Your Influence Into Income",
  description:
    "The AI-powered business launchpad for Indian creators. Discover what you can sell, get INR pricing recommendations and launch a beautiful storefront in minutes.",
  keywords: [
    "creator economy",
    "influencer storefront",
    "AI storefront",
    "digital products India",
    "creator monetisation",
  ],
  authors: [{ name: "CreatorOS AI" }],
  openGraph: {
    title: "CreatorOS AI - Turn Your Influence Into Income",
    description:
      "AI discovers what you can sell, recommends INR pricing and builds your personalised storefront in minutes.",
    siteName: "CreatorOS AI",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7655E9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${baloo.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
