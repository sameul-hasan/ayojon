"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  X,
  Bell,
  Sparkles,
} from "lucide-react";
import { Logo } from "./Logo";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";
import { UserAccountMenu } from "./UserAccountMenu";
import { cn } from "@/lib/ui/cn";
import { useAuth } from "@/lib/firebase/auth-context";
import { normalizeUserRole } from "@/lib/permissions/rbac";

export interface PublicNavbarProps {
  items?: Array<{ label: string; href: string }>;
  activeHref?: string;
  signInHref?: string;
  hostHref?: string;
}

export function PublicNavbar({
  items,
  activeHref,
  signInHref = "/login",
  hostHref = "/portal?tab=organizer",
}: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { currentUser, signOutUser } = useAuth();

  const role = useMemo(() => {
    return normalizeUserRole(currentUser?.role || currentUser?.platform_role);
  }, [currentUser]);

  // Track scroll position for subtle sticky elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-200",
          isScrolled
            ? "border-b border-line bg-canvas/95 backdrop-blur-md shadow-xs py-0"
            : "border-b border-line/60 bg-canvas py-0.5"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* LEFT: LOGO */}
          <div className="flex items-center gap-3 shrink-0">
            <Logo size="md" showText={false} />
          </div>

          {/* CENTER: DESKTOP MULTI-GROUP NAVIGATION */}
          <DesktopNavigation activeHref={activeHref} role={role} />

          {/* RIGHT: SEARCH, ACTIONS & USER MENU */}
          <div className="flex items-center gap-2">
            {/* Quick Search Trigger (Desktop) */}
            <div className="relative hidden lg:block">
              {searchOpen ? (
                <form
                  action="/events"
                  method="get"
                  onSubmit={() => setSearchOpen(false)}
                  className="relative flex items-center"
                >
                  <Search className="pointer-events-none absolute left-3 size-3.5 text-ink-muted" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    name="q"
                    placeholder="Search events, topics..."
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setSearchOpen(false);
                    }}
                    onBlur={() => {
                      // Small timeout to allow form submit
                      setTimeout(() => setSearchOpen(false), 200);
                    }}
                    className="h-9 w-60 rounded-btn border border-brand-300 bg-surface pl-8 pr-7 text-xs text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-2 text-ink-muted hover:text-ink"
                    title="Close search"
                  >
                    <X className="size-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex h-9 items-center gap-2 rounded-btn border border-line bg-surface/80 px-3 text-xs text-ink-muted hover:bg-canvas-alt hover:text-ink transition shadow-xs"
                  title="Search events (Ctrl+K or click)"
                >
                  <Search className="size-3.5 text-ink-muted" />
                  <span>Search events...</span>
                  <kbd className="hidden xl:inline-block rounded border border-line bg-canvas-alt px-1.5 py-0.5 text-[10px] font-mono text-ink-muted">
                    /
                  </kbd>
                </button>
              )}
            </div>

            {/* Quick Search Icon for tablets */}
            <Link
              href="/events"
              className="flex size-9 items-center justify-center rounded-btn text-ink-muted hover:bg-canvas-alt hover:text-ink lg:hidden"
              aria-label="Search events"
            >
              <Search className="size-4" />
            </Link>

            {/* AUTH / ACTION BAR */}
            {currentUser && role !== "guest" ? (
              <div className="flex items-center gap-1.5">
                {/* User Account Menu with role badge & dashboard switch */}
                <UserAccountMenu
                  user={currentUser}
                  role={role}
                  isOpen={accountMenuOpen}
                  onToggle={() => setAccountMenuOpen((v) => !v)}
                  onClose={() => setAccountMenuOpen(false)}
                  onSignOut={() => signOutUser()}
                  activeHref={activeHref}
                />
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href={signInHref}
                  className="rounded-btn px-3.5 py-2 text-sm font-semibold text-ink hover:bg-canvas-alt transition"
                >
                  Sign In
                </Link>
                <Link
                  href={hostHref}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-btn bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition"
                >
                  <Sparkles className="size-3.5" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}

            {/* MOBILE HAMBURGER BUTTON */}
            <button
              type="button"
              className="flex size-10 cursor-pointer items-center justify-center rounded-btn hover:bg-canvas-alt md:hidden text-ink"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER FULLSCREEN */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentUser={currentUser}
        role={role}
        onSignOut={() => signOutUser()}
        signInHref={signInHref}
        hostHref={hostHref}
        activeHref={activeHref}
      />
    </>
  );
}
