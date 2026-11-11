"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Building2, LayoutDashboard, HelpCircle, Layers } from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { AIAssistantWidget } from "@/components/ai/AIAssistantWidget";
import { Button } from "@/components/ui/Button";

export default function AIAssistantPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <PublicNavbar
        items={[
          { label: "Explore", href: "/events" },
          { label: "Venues", href: "/venues" },
          { label: "AI Planner", href: "/ai-event-assistant" },
          { label: "Categories", href: "/#categories" },
        ]}
        activeHref="/ai-event-assistant"
        signInHref="/login"
        hostHref="/portal"
      />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* TOP HEADER */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 mb-2">
              <Sparkles className="size-3.5" />
              <span>Smart Event Architect for Bangladesh</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              AI Event Planning & RFQ Assistant
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-muted">
              Plan guest logistics, compare Dhaka auditorium rental rates, calculate catering & sound splits, and generate formal quotations in seconds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/venues">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Building2 className="size-3.5" /> Browse Venues
              </Button>
            </Link>
            <Link href="/portal?tab=organizer">
              <Button variant="primary" size="sm" className="gap-1.5">
                <LayoutDashboard className="size-3.5" /> Organizer Studio
              </Button>
            </Link>
          </div>
        </div>

        {/* WIDGET CONTAINER */}
        <div className="h-[750px] shadow-pop rounded-card overflow-hidden">
          <AIAssistantWidget standalone />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

