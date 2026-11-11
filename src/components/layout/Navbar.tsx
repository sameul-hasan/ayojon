"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Search,
  X,
  Sparkles,
  Ticket,
  Calendar,
  Building2,
  ScanLine,
  ShieldAlert,
  ChevronDown,
  LogOut,
  User,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  Compass,
  CheckCircle2,
  Radio,
  ExternalLink,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/ui/cn";
import { useAuth, DEMO_PERSONAS, type UserRole } from "@/lib/firebase/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import { isSuperAdmin as checkIsSuperAdmin, normalizeUserRole } from "@/lib/permissions/rbac";

export interface NavbarProps {
  activeHref?: string;
  signInHref?: string;
  hostHref?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

export function Navbar({
  activeHref,
  signInHref = "/login",
  hostHref = "/portal?tab=organizer",
}: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = activeHref || location.pathname;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const { currentUser, activeRole, signOutUser, switchPersona } = useAuth();
  const { role, isSuperAdmin, dbRoles } = usePermissions();

  const isUserSuperAdmin = useMemo(() => {
    return isSuperAdmin || role === "super_admin" || checkIsSuperAdmin(currentUser);
  }, [isSuperAdmin, role, currentUser]);

  // Track scroll position for header elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
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

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
        setPersonaMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut '/' to trigger search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setAccountMenuOpen(false);
        setPersonaMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Generate dynamic navigation items based on active role
  const navItems = useMemo<NavItem[]>(() => {
    const baseItems: NavItem[] = [
      { label: "Explore Events", href: "/events", icon: Compass },
      { label: "Venues", href: "/venues", icon: Building2 },
    ];

    if (!currentUser || role === "guest") {
      return [
        ...baseItems,
        { label: "AI Event Planner", href: "/ai-event-assistant", icon: Sparkles, badge: "AI" },
        { label: "About", href: "/about" },
      ];
    }

    if (isUserSuperAdmin || role === "admin") {
      return [
        {
          label: "👑 Super Admin Console",
          href: "/admin",
          icon: ShieldAlert,
          badge: "Root",
          highlight: true,
        },
        { label: "Portal Hub", href: "/portal", icon: Layers },
        ...baseItems,
        { label: "AI Assistant", href: "/ai-event-assistant", icon: Sparkles },
      ];
    }

    if (role === "organizer") {
      return [
        {
          label: "Organizer Dashboard",
          href: "/portal?tab=organizer",
          icon: Calendar,
          badge: "Manage",
        },
        ...baseItems,
        { label: "AI Event Planner", href: "/ai-event-assistant", icon: Sparkles },
      ];
    }

    if (role === "staff") {
      return [
        {
          label: "Ticket Scanner",
          href: "/portal?tab=scanner",
          icon: ScanLine,
          badge: "Active Gate",
          highlight: true,
        },
        ...baseItems,
      ];
    }

    if (role === "venue_owner" || role === "vendor") {
      return [
        {
          label: "Provider Dashboard",
          href: "/portal?tab=provider",
          icon: Building2,
          badge: "RFQs",
        },
        ...baseItems,
        { label: "Marketplace", href: "/venues" },
      ];
    }

    if (role === "sponsor") {
      return [
        {
          label: "Sponsor Hub",
          href: "/portal?tab=sponsor",
          icon: Briefcase,
          badge: "Bids",
        },
        ...baseItems,
      ];
    }

    // Default: Attendee
    return [
      {
        label: "My Ticket Wallet",
        href: "/portal?tab=wallet",
        icon: Ticket,
        badge: "Tickets",
      },
      ...baseItems,
      { label: "AI Assistant", href: "/ai-event-assistant", icon: Sparkles },
    ];
  }, [role, currentUser, isUserSuperAdmin]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const roleBadgeConfig = useMemo(() => {
    if (isUserSuperAdmin) {
      return {
        label: "Super Admin",
        className: "bg-purple-100 text-purple-800 border-purple-300 ring-1 ring-purple-400/40",
        icon: "👑",
      };
    }
    switch (role) {
      case "organizer":
        return { label: "Organizer", className: "bg-blue-100 text-blue-800 border-blue-200", icon: "🎪" };
      case "staff":
        return { label: "Gate Staff", className: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "📱" };
      case "venue_owner":
        return { label: "Venue Partner", className: "bg-amber-100 text-amber-800 border-amber-200", icon: "🏛️" };
      case "vendor":
        return { label: "Vendor", className: "bg-orange-100 text-orange-800 border-orange-200", icon: "🔊" };
      case "sponsor":
        return { label: "Sponsor", className: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: "💼" };
      case "admin":
        return { label: "Admin", className: "bg-purple-100 text-purple-800 border-purple-200", icon: "🛡️" };
      default:
        return { label: "Attendee", className: "bg-teal-100 text-teal-800 border-teal-200", icon: "🎟️" };
    }
  }, [role, isUserSuperAdmin]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-200",
          isScrolled
            ? "border-b border-line bg-canvas/95 backdrop-blur-md shadow-xs py-0"
            : "border-b border-line/60 bg-canvas py-1"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* 1. BRAND LOGO */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <Logo size="md" showText={true} />
            </Link>
          </div>

          {/* 2. DYNAMIC RBAC DESKTOP NAVIGATION */}
          <nav aria-label="Main dynamic navigation" className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-btn px-3 py-2 text-xs font-semibold transition-all",
                    item.highlight
                      ? "bg-purple-600 text-white shadow-xs hover:bg-purple-700"
                      : isActive
                      ? "bg-brand-50 text-brand-700 font-bold border border-brand-200/80"
                      : "text-ink hover:bg-canvas-alt hover:text-brand-700"
                  )}
                >
                  {Icon && <Icon className="size-3.5 shrink-0 opacity-80" />}
                  <span>{item.label}</span>
                  {item.badge && !item.highlight && (
                    <span className="rounded-full bg-brand-100 px-1.5 py-0.2 text-[10px] font-bold text-brand-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. RIGHT SECTION: QUICK SEARCH, PERSONA SWITCHER & USER MENU */}
          <div className="flex items-center gap-2">
            {/* Quick Search Bar (Desktop) */}
            <div className="relative hidden md:block">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-3 size-3.5 text-ink-muted" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events, topics..."
                    onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                    className="h-9 w-60 rounded-btn border border-brand-300 bg-surface pl-8 pr-7 text-xs text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-2 text-ink-muted hover:text-ink"
                  >
                    <X className="size-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex h-9 items-center gap-2 rounded-btn border border-line bg-surface/80 px-3 text-xs text-ink-muted hover:bg-canvas-alt hover:text-ink transition shadow-xs"
                  title="Search events (Press /)"
                >
                  <Search className="size-3.5 text-ink-muted" />
                  <span>Search events...</span>
                  <kbd className="hidden lg:inline-block rounded border border-line bg-canvas-alt px-1.5 py-0.5 text-[10px] font-mono text-ink-muted">
                    /
                  </kbd>
                </button>
              )}
            </div>

            {/* Quick Search Trigger (Mobile/Tablet) */}
            <Link
              to="/events"
              className="flex size-9 items-center justify-center rounded-btn text-ink-muted hover:bg-canvas-alt hover:text-ink md:hidden"
              aria-label="Search events"
            >
              <Search className="size-4" />
            </Link>

            {/* AUTH & RBAC USER ACCOUNT MENU */}
            {currentUser && role !== "guest" ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-btn border border-line bg-surface p-1.5 pr-2.5 hover:bg-canvas-alt transition shadow-xs"
                  aria-expanded={accountMenuOpen}
                  aria-label="User navigation and role switcher"
                >
                  <div className="flex size-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-xs">
                    {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : "US"}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-ink leading-tight line-clamp-1">
                      {currentUser.displayName || "User"}
                    </span>
                    <span className="text-[10px] text-ink-muted leading-none">
                      {roleBadgeConfig.icon} {roleBadgeConfig.label}
                    </span>
                  </div>
                  <ChevronDown className="size-3.5 text-ink-muted" />
                </button>

                {/* ACCOUNT & PERSONA POPUP DROPDOWN */}
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-line bg-surface p-2 shadow-pop z-50 animate-in fade-in-50 zoom-in-95">
                    {/* User Profile Header */}
                    <div className="p-3 border-b border-line/60 bg-canvas-alt/50 rounded-xl mb-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-ink">{currentUser.displayName}</span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                            roleBadgeConfig.className
                          )}
                        >
                          {roleBadgeConfig.icon} {roleBadgeConfig.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5">{currentUser.email}</p>
                    </div>

                    {/* Dynamic Role Quick Links */}
                    <div className="space-y-0.5 mb-2">
                      {isUserSuperAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
                        >
                          <ShieldAlert className="size-3.5 text-purple-600" />
                          <span>👑 Super Admin Console</span>
                        </Link>
                      )}

                      <Link
                        to="/portal?tab=wallet"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-ink hover:bg-canvas-alt transition"
                      >
                        <Ticket className="size-3.5 text-ink-muted" />
                        <span>My Ticket Wallet</span>
                      </Link>

                      <Link
                        to="/portal?tab=organizer"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-ink hover:bg-canvas-alt transition"
                      >
                        <Calendar className="size-3.5 text-ink-muted" />
                        <span>Organizer Dashboard</span>
                      </Link>

                      <Link
                        to="/portal?tab=scanner"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-ink hover:bg-canvas-alt transition"
                      >
                        <ScanLine className="size-3.5 text-ink-muted" />
                        <span>Gate Check-in Scanner</span>
                      </Link>
                    </div>

                    {/* LIVE RBAC PERSONA SWITCHER SECTION */}
                    <div className="border-t border-line/60 pt-2 mb-2">
                      <div className="flex items-center justify-between px-2.5 py-1">
                        <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                          Test Real-Time RBAC Roles
                        </span>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {Object.values(DEMO_PERSONAS).map((persona) => {
                          const isCurrent = currentUser.uid === persona.uid;
                          return (
                            <button
                              key={persona.uid}
                              type="button"
                              onClick={async () => {
                                await switchPersona(persona.uid);
                                setAccountMenuOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition",
                                isCurrent
                                  ? "bg-brand-50 text-brand-800 font-bold border border-brand-200"
                                  : "text-ink hover:bg-canvas-alt"
                              )}
                            >
                              <div className="truncate">
                                <p className="truncate leading-tight">{persona.displayName}</p>
                                <p className="text-[10px] text-ink-muted capitalize">
                                  {persona.role === "super_admin" ? "👑 Super Admin" : persona.role}
                                </p>
                              </div>
                              {isCurrent && <CheckCircle2 className="size-3.5 text-brand-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-line/60 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await signOutUser();
                          setAccountMenuOpen(false);
                          navigate("/");
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut className="size-3.5" />
                        <span>Sign Out (Guest Mode)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to={signInHref}
                  className="rounded-btn px-3.5 py-2 text-xs font-semibold text-ink hover:bg-canvas-alt transition"
                >
                  Sign In
                </Link>
                <Link
                  to={hostHref}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-btn bg-brand-600 px-3.5 text-xs font-semibold text-white hover:bg-brand-700 shadow-sm transition"
                >
                  <Sparkles className="size-3.5" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}

            {/* MOBILE HAMBURGER TOGGLE */}
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-btn hover:bg-canvas-alt lg:hidden text-ink"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* 4. FULLSCREEN MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-canvas lg:hidden animate-in fade-in duration-200">
          {/* Mobile Drawer Header */}
          <div className="flex h-16 items-center justify-between border-b border-line px-4 sm:px-6">
            <Logo size="md" showText={true} />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="flex size-10 items-center justify-center rounded-btn hover:bg-canvas-alt text-ink"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Mobile Drawer Body */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 sm:px-6">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, venues..."
                className="h-11 w-full rounded-btn border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none"
              />
            </form>

            {/* User Profile Card (if signed in) */}
            {currentUser && role !== "guest" && (
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-ink">{currentUser.displayName}</h4>
                    <p className="text-xs text-ink-muted">{currentUser.email}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
                      roleBadgeConfig.className
                    )}
                  >
                    {roleBadgeConfig.icon} {roleBadgeConfig.label}
                  </span>
                </div>
              </div>
            )}

            {/* Dynamic Navigation Links */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider px-2">Navigation</span>
              {navItems.map((item) => {
                const isActive = currentPath === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition",
                      item.highlight
                        ? "bg-purple-600 text-white font-bold"
                        : isActive
                        ? "bg-brand-50 text-brand-700 font-bold border border-brand-200"
                        : "text-ink hover:bg-canvas-alt"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="size-4 shrink-0 opacity-80" />}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && !item.highlight && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Real-Time RBAC Persona Switcher */}
            <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Radio className="size-3.5 text-brand-600 animate-pulse" />
                <span>Switch RBAC Persona (Live Demo)</span>
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.values(DEMO_PERSONAS).map((persona) => {
                  const isCurrent = currentUser?.uid === persona.uid;
                  return (
                    <button
                      key={persona.uid}
                      type="button"
                      onClick={async () => {
                        await switchPersona(persona.uid);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition",
                        isCurrent
                          ? "bg-brand-50 text-brand-800 font-bold border border-brand-200"
                          : "text-ink hover:bg-canvas-alt border border-line/60"
                      )}
                    >
                      <div>
                        <span className="font-semibold block">{persona.displayName}</span>
                        <span className="text-[10px] text-ink-muted capitalize">
                          {persona.role === "super_admin" ? "👑 Super Admin" : persona.role}
                        </span>
                      </div>
                      {isCurrent && <CheckCircle2 className="size-4 text-brand-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auth Actions */}
            <div className="pt-2">
              {currentUser && role !== "guest" ? (
                <button
                  type="button"
                  onClick={async () => {
                    await signOutUser();
                    setMobileMenuOpen(false);
                    navigate("/");
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-btn border border-line bg-surface py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="size-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to={signInHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-btn border border-line bg-surface py-3 text-sm font-semibold text-ink hover:bg-canvas-alt"
                  >
                    Sign In
                  </Link>
                  <Link
                    to={hostHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-btn bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
