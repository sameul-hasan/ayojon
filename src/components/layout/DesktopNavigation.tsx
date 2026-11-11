"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { NavigationDropdown, type NavDropdownItem } from "./NavigationDropdown";
import type { NormalizedRole } from "@/lib/permissions/rbac";

export interface DesktopNavigationProps {
  activeHref?: string;
  role: NormalizedRole;
}

export function DesktopNavigation({ activeHref, role }: DesktopNavigationProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const close = () => {
    setOpenDropdown(null);
  };

  // 1. Explore Menu
  const exploreItems: NavDropdownItem[] = [
    {
      label: "All Events",
      href: "/events",
      description: "Discover all concerts, workshops & meetups",
      icon: Compass,
    },
    {
      label: "Upcoming Events",
      href: "/events?sort=upcoming",
      description: "Events scheduled in the coming weeks",
      icon: Calendar,
    },
    {
      label: "Popular Experiences",
      href: "/events?sort=popular",
      description: "Trending gatherings and high-demand shows",
      icon: Sparkles,
      badge: "Trending",
    },
    {
      label: "Browse by Category",
      href: "/#categories",
      description: "Music, Tech, Festivals, Arts & Gaming",
      icon: Layers,
    },
  ];

  // 2. For Organizers Menu
  const organizerItems: NavDropdownItem[] = useMemo(() => {
    const list: NavDropdownItem[] = [
      {
        label: "Host an Event",
        href: "/portal?tab=organizer",
        description: "Publish your event & sell tickets in BDT",
        icon: Sparkles,
        badge: "Create",
      },
    ];

    if (role === "organizer") {
      list.push({
        label: "Organizer Dashboard",
        href: "/portal?tab=organizer",
        description: "Your active events, revenue & tickets sold",
        icon: Calendar,
      });
    }

    list.push(
      {
        label: "Event Management",
        href: "/portal",
        description: "Manage registrations, check-ins & payouts",
        icon: Layers,
      },
      {
        label: "AI Event Planner",
        href: "/ai-event-assistant",
        description: "AI-assisted budgeting & timeline planner",
        icon: Sparkles,
        badge: "Smart",
      }
    );

    return list;
  }, [role]);

  // 3. Marketplace Menu
  const marketplaceItems: NavDropdownItem[] = [
    {
      label: "Find Venues",
      href: "/venues",
      description: "Convention centers, auditoriums & studios",
      icon: Building,
    },
    {
      label: "Find Event Services",
      href: "/venues?tab=services",
      description: "Sound, catering, photography & decor",
      icon: Sparkles,
    },
    {
      label: "Become a Provider",
      href: "/portal?tab=provider",
      description: "List your space or services for event RFQs",
      icon: Handshake,
      badge: "Partner",
    },
  ];

  // 4. About Menu
  const aboutItems: NavDropdownItem[] = [
    {
      label: "About Aayojon",
      href: "/about",
      description: "Our story, purpose & event ecosystem",
      icon: Info,
    },
    {
      label: "Our Mission & Vision",
      href: "/about#mission",
      description: "Empowering meaningful experiences in BD",
      icon: Heart,
    },
    {
      label: "Contact Us",
      href: "/about#contact",
      description: "Get in touch with the Aayojon team",
      icon: Mail,
    },
  ];

  return (
    <nav
      aria-label="Desktop primary navigation"
      className="hidden items-center gap-1 md:flex"
    >
      <NavigationDropdown
        label="Explore"
        items={exploreItems}
        isOpen={openDropdown === "explore"}
        onToggle={() => toggle("explore")}
        onClose={close}
        activeHref={activeHref}
      />

      <NavigationDropdown
        label="For Organizers"
        items={organizerItems}
        isOpen={openDropdown === "organizers"}
        onToggle={() => toggle("organizers")}
        onClose={close}
        activeHref={activeHref}
      />

      <NavigationDropdown
        label="Marketplace"
        items={marketplaceItems}
        isOpen={openDropdown === "marketplace"}
        onToggle={() => toggle("marketplace")}
        onClose={close}
        activeHref={activeHref}
      />

      <NavigationDropdown
        label="About"
        items={aboutItems}
        isOpen={openDropdown === "about"}
        onToggle={() => toggle("about")}
        onClose={close}
        activeHref={activeHref}
      />
    </nav>
  );
}

