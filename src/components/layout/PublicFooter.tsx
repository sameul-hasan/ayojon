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
      { label: "Host an Event", href: "/organizer" },
      { label: "Find Venues", href: "/venues" },
      { label: "Find Event Services", href: "/venues?tab=services" },
      { label: "AI Event Planner", href: "/ai-event-assistant" },
      { label: "Organizer Studio", href: "/organizer" },
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
      { label: "Platform Roles & RBAC", href: "/admin" },
      { label: "Attendee Wallet", href: "/wallet" },
      { label: "Gate Verification", href: "/scanner" },
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
              Aayojon is a modern Bangladesh-focused event discovery, ticketing, and event management platform. Discover experiences, book tickets, and organize events seamlessly.
            </p>
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

        {/* SSLCommerz Verified Payment Gateway Banner */}
        <div className="mt-10 border-t border-line/60 pt-6">
          <div className="flex flex-col items-center justify-between gap-2 text-center sm:text-left sm:flex-row mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              100% Secure Payments Powered by SSLCommerz
            </span>
            <span className="text-[11px] text-ink-muted">
              Instant bKash, Nagad, Rocket, Cards & Internet Banking
            </span>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-3 shadow-xs flex items-center justify-center overflow-hidden">
            <img
              src="/ssl.png"
              alt="SSLCommerz Supported Payment Methods: bKash, Nagad, Visa, Mastercard, AMEX, Rocket, Upay"
              className="w-full h-auto object-contain max-h-12 sm:max-h-14"
              loading="lazy"
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div>
            © {new Date().getFullYear()} Aayojon Technologies Ltd. All rights reserved.
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

      {/* Decorative Bangladesh City Skyline */}
      <div className="w-full overflow-hidden border-t border-line/40 bg-canvas-alt pt-2">
        <img
          src="/city1.png"
          alt="Bangladesh City Skyline"
          className="w-full h-12 sm:h-16 md:h-20 object-cover object-bottom opacity-85 select-none pointer-events-none"
          loading="lazy"
        />
      </div>
    </footer>
  );
}
