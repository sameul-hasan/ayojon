import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutMissionSection } from "@/components/about/AboutMissionSection";
import { AboutFeaturesSection } from "@/components/about/AboutFeaturesSection";
import { AboutHowItWorksSection, AboutWhySection } from "@/components/about/AboutHowItWorksSection";
import { AboutCTA, AboutContactSection } from "@/components/about/AboutCTA";

export const metadata: Metadata = {
  title: "About Aayojon (আয়োজন) — Bringing People Together Through Experiences",
  description:
    "Learn about Aayojon, Bangladesh's modern platform for event discovery, ticketing, venues, and event management. Discover our mission, features, and team.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicNavbar activeHref="/about" />
      <main className="flex-1">
        {/* SECTION 1: ABOUT HERO */}
        <AboutHero />

        {/* SECTION 2, 3, 4: WHO WE ARE, MISSION, VISION */}
        <AboutMissionSection />

        {/* SECTION 5: WHAT YOU CAN DO WITH AAYOJON */}
        <AboutFeaturesSection />

        {/* SECTION 6: HOW AAYOJON WORKS */}
        <AboutHowItWorksSection />

        {/* SECTION 7: WHY AAYOJON */}
        <AboutWhySection />

        {/* SECTION 8: CALL TO ACTION */}
        <AboutCTA />

        {/* CONTACT SECTION */}
        <AboutContactSection />
      </main>
      <PublicFooter />
    </div>
  );
}

