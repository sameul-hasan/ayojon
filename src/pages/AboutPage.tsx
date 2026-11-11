import React from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutMissionSection } from "@/components/about/AboutMissionSection";
import { AboutFeaturesSection } from "@/components/about/AboutFeaturesSection";
import { AboutHowItWorksSection, AboutWhySection } from "@/components/about/AboutHowItWorksSection";
import { AboutCTA, AboutContactSection } from "@/components/about/AboutCTA";

export function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicNavbar activeHref="/about" />
      <main className="flex-1">
        <AboutHero />
        <AboutMissionSection />
        <AboutFeaturesSection />
        <AboutHowItWorksSection />
        <AboutWhySection />
        <AboutCTA />
        <AboutContactSection />
      </main>
      <PublicFooter />
    </div>
  );
}
