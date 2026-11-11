import React from "react";
import Link from "@/components/ui/Link";
import {
  Compass,
  Calendar,
  Layers,
  Sparkles,
  Building,
  Heart,
  Mail,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { Logo } from "./Logo";

const FOOTER_SECTIONS = [
  {
    title: "Explore",
    links: [
      { label: "All Events", href: "/events" },
      { label: "Upcoming Events", href: "/events?sort=upcoming" },
      { label: "Popular Experiences", href: "/events?sort=popular" },
      { label: "Browse Categories", href: "/#categories" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Host an Event", href: "/portal?tab=organizer" },
      { label: "Find Venues", href: "/venues" },
      { label: "Find Event Services", href: "/venues?tab=services" },
      { label: "AI Event Planner", href: "/ai-event-assistant" },
      { label: "Organizer Studio", href: "/portal" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Aayojon", href: "/about" },
      { label: "Our Mission", href: "/about#mission" },
      { label: "Our Vision", href: "/about#vision" },
      { label: "How It Works", href: "/about#how-it-works" },
      { label: "Contact Us", href: "/about#contact" },
    ],
  },
  {
    title: "Legal & Trust",
    links: [
      { label: "Design System", href: "/design" },
      { label: "Platform Roles & RBAC", href: "/portal" },
      { label: "Attendee Wallet", href: "/portal?tab=wallet" },
      { label: "Gate Verification", href: "/portal?tab=scanner" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-canvas-alt text-ink">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Identity Column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="lg" showText subtitle="Bangladesh" />
            <p className="text-sm text-ink-muted max-w-sm leading-relaxed">
              Aayojon (আয়োজন) is a modern Bangladesh-focused event discovery, ticketing, and event management platform. Discover experiences, book tickets, and organize events seamlessly.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              <Sparkles className="size-3.5 text-brand-600" />
              <span>Make Moments Happen</span>
            </div>

            {/* Local MFS Trust Badges */}
            <div className="pt-3">
              <span className="text-[11px] font-semibold text-ink-muted block uppercase tracking-wider mb-2">
                Supported Local Payment Methods
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                {["bKash", "Nagad", "Rocket", "Upay", "Visa", "Mastercard", "SSLCommerz"].map((pm) => (
                  <span
                    key={pm}
                    className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-ink shadow-xs"
                  >
                    {pm}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Columns */}
          {FOOTER_SECTIONS.map((sec) => (
            <div key={sec.title} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                {sec.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {sec.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-ink-muted hover:text-brand-600 transition-colors inline-block text-xs sm:text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div>
            © {new Date().getFullYear()} Aayojon (আয়োজন) Technologies Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-brand-600 transition-colors">About Us</Link>
            <span>·</span>
            <Link href="/about#contact" className="hover:text-brand-600 transition-colors">Contact</Link>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-ink font-medium">
              Made with pride in Bangladesh
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
