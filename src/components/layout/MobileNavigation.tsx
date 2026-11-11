"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Calendar,
  Sparkles,
  Layers,
  Building,
  Handshake,
  Info,
  Heart,
  Mail,
  X,
  ChevronDown,
  User,
  LayoutDashboard,
  LogOut,
  Ticket,
  Search,
} from "lucide-react";
import { cn } from "@/lib/ui/cn";
import type { NormalizedRole } from "@/lib/permissions/rbac";

export interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
    display_name?: string;
  } | null;
  role: NormalizedRole;
  onSignOut: () => void;
  signInHref?: string;
  hostHref?: string;
  activeHref?: string;
}

export function MobileNavigation({
  isOpen,
  onClose,
  currentUser,
  role,
  onSignOut,
  signInHref = "/login",
  hostHref = "/portal",
  activeHref,
}: MobileNavigationProps) {
  const [openSection, setOpenSection] = useState<string | null>("explore");

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const navCls = (href: string) =>
    cn(
      "flex items-center gap-2.5 rounded-btn px-3 py-2 text-sm font-medium transition",
      activeHref === href
        ? "bg-brand-50 text-brand-700 font-semibold"
        : "text-ink hover:bg-canvas-alt hover:text-brand-600"
    );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      className="fixed inset-0 z-50 flex flex-col bg-canvas md:hidden overflow-y-auto"
    >
      {/* Top Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4 sm:px-6">
        <Link href="/" onClick={onClose} className="inline-flex items-center gap-2">
          <img src="/logo.png" alt="Aayojon" className="h-8 w-auto object-contain" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex size-10 items-center justify-center rounded-btn hover:bg-canvas-alt text-ink"
        >
          <X className="size-6" />
        </button>
      </div>

      {/* Search Shortcut */}
      <div className="p-4 border-b border-line bg-canvas-alt/50">
        <form action="/events" method="get" onSubmit={onClose} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            name="q"
            placeholder="Search events, topics, organizers..."
            className="h-10 w-full rounded-btn border border-line bg-surface pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </form>
      </div>

      {/* Nav Accordions */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* SECTION 1: EXPLORE */}
        <div className="rounded-card border border-line bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("explore")}
            className="flex w-full items-center justify-between p-3.5 text-left font-semibold text-sm text-ink"
          >
            <span className="flex items-center gap-2">
              <Compass className="size-4 text-brand-600" />
              Explore Events
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-ink-muted transition-transform duration-200",
                openSection === "explore" && "rotate-180 text-brand-700"
              )}
            />
          </button>
          {openSection === "explore" && (
            <div className="border-t border-line bg-canvas-alt/30 p-2 space-y-1">
              <Link href="/events" onClick={onClose} className={navCls("/events")}>
                <Compass className="size-4 text-brand-600" />
                All Events
              </Link>
              <Link href="/events?sort=upcoming" onClick={onClose} className={navCls("/events?sort=upcoming")}>
                <Calendar className="size-4 text-brand-600" />
                Upcoming Events
              </Link>
              <Link href="/events?sort=popular" onClick={onClose} className={navCls("/events?sort=popular")}>
                <Sparkles className="size-4 text-pink" />
                Popular Experiences
              </Link>
              <Link href="/#categories" onClick={onClose} className={navCls("/#categories")}>
                <Layers className="size-4 text-ink-muted" />
                Browse by Category
              </Link>
            </div>
          )}
        </div>

        {/* SECTION 2: FOR ORGANIZERS */}
        <div className="rounded-card border border-line bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("organizers")}
            className="flex w-full items-center justify-between p-3.5 text-left font-semibold text-sm text-ink"
          >
            <span className="flex items-center gap-2">
              <LayoutDashboard className="size-4 text-brand-600" />
              For Organizers
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-ink-muted transition-transform duration-200",
                openSection === "organizers" && "rotate-180 text-brand-700"
              )}
            />
          </button>
          {openSection === "organizers" && (
            <div className="border-t border-line bg-canvas-alt/30 p-2 space-y-1">
              <Link href="/portal?tab=organizer" onClick={onClose} className={navCls("/portal?tab=organizer")}>
                <Sparkles className="size-4 text-brand-600" />
                Host an Event
              </Link>
              {role === "organizer" && (
                <Link href="/portal?tab=organizer" onClick={onClose} className={navCls("/portal?tab=organizer")}>
                  <LayoutDashboard className="size-4 text-brand-600" />
                  Organizer Studio
                </Link>
              )}
              <Link href="/portal" onClick={onClose} className={navCls("/portal")}>
                <Calendar className="size-4 text-ink-muted" />
                Event Management
              </Link>
              <Link href="/ai-event-assistant" onClick={onClose} className={navCls("/ai-event-assistant")}>
                <Sparkles className="size-4 text-brand-600" />
                AI Planning Assistant
              </Link>
            </div>
          )}
        </div>

        {/* SECTION 3: MARKETPLACE */}
        <div className="rounded-card border border-line bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("marketplace")}
            className="flex w-full items-center justify-between p-3.5 text-left font-semibold text-sm text-ink"
          >
            <span className="flex items-center gap-2">
              <Building className="size-4 text-brand-600" />
              Marketplace
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-ink-muted transition-transform duration-200",
                openSection === "marketplace" && "rotate-180 text-brand-700"
              )}
            />
          </button>
          {openSection === "marketplace" && (
            <div className="border-t border-line bg-canvas-alt/30 p-2 space-y-1">
              <Link href="/venues" onClick={onClose} className={navCls("/venues")}>
                <Building className="size-4 text-brand-600" />
                Find Venues
              </Link>
              <Link href="/venues?tab=services" onClick={onClose} className={navCls("/venues?tab=services")}>
                <Sparkles className="size-4 text-brand-600" />
                Find Event Services
              </Link>
              <Link href="/portal?tab=provider" onClick={onClose} className={navCls("/portal?tab=provider")}>
                <Handshake className="size-4 text-emerald-600" />
                Become a Provider
              </Link>
            </div>
          )}
        </div>

        {/* SECTION 4: ABOUT */}
        <div className="rounded-card border border-line bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("about")}
            className="flex w-full items-center justify-between p-3.5 text-left font-semibold text-sm text-ink"
          >
            <span className="flex items-center gap-2">
              <Info className="size-4 text-brand-600" />
              About
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-ink-muted transition-transform duration-200",
                openSection === "about" && "rotate-180 text-brand-700"
              )}
            />
          </button>
          {openSection === "about" && (
            <div className="border-t border-line bg-canvas-alt/30 p-2 space-y-1">
              <Link href="/about" onClick={onClose} className={navCls("/about")}>
                <Info className="size-4 text-brand-600" />
                About Aayojon
              </Link>
              <Link href="/about#mission" onClick={onClose} className={navCls("/about#mission")}>
                <Heart className="size-4 text-pink" />
                Our Mission & Vision
              </Link>
              <Link href="/about#contact" onClick={onClose} className={navCls("/about#contact")}>
                <Mail className="size-4 text-ink-muted" />
                Contact Us
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Auth Profile / Call to Action */}
      <div className="border-t border-line bg-surface p-4">
        {currentUser && role !== "guest" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 text-xs border border-brand-200">
                  <User className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-ink leading-tight">
                    {currentUser.displayName || currentUser.display_name || "Account"}
                  </p>
                  <p className="text-[10px] text-ink-muted uppercase font-semibold">
                    {role.replace("_", " ")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="inline-flex items-center gap-1 rounded-btn border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-coral hover:bg-red-50"
              >
                <LogOut className="size-3.5" />
                Sign Out
              </button>
            </div>

            <Link
              href="/portal"
              onClick={onClose}
              className="flex h-11 w-full items-center justify-center rounded-btn bg-brand-600 font-semibold text-white text-sm hover:bg-brand-700 shadow-sm"
            >
              My Dashboard ({role.replace("_", " ")})
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={signInHref}
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-btn border border-line bg-surface text-sm font-semibold text-ink hover:bg-canvas-alt"
            >
              Sign In
            </Link>
            <Link
              href={hostHref}
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-btn bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

