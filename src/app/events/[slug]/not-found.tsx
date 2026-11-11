import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Compass, Search } from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata = { title: "Event not found — Aayojon" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      <PublicNavbar
        items={[
          { label: "Explore", href: "/events" },
          { label: "Categories", href: "/#categories" },
          { label: "About", href: "/#about" },
        ]}
        activeHref="/events"
        signInHref="/login"
        hostHref="/portal"
      />

      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm">
          <Calendar className="size-10" aria-hidden />
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Event not found
        </h1>
        <p className="mt-3 text-base text-ink-muted leading-relaxed">
          The event you are looking for may have been concluded, removed, or the link may be incorrect.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/events"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
          >
            <Compass className="size-4" aria-hidden />
            Browse all events
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-btn border border-line bg-surface px-6 text-sm font-semibold text-ink shadow-sm transition hover:border-brand-300 hover:text-brand-700 active:scale-95"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Return to homepage
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
