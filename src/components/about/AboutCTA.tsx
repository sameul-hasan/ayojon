import React from "react";
import Link from "@/components/ui/Link";
import { ArrowRight, Compass, Sparkles, Mail, MapPin } from "lucide-react";

export function AboutCTA() {
  return (
    <section className="relative overflow-hidden bg-brand-900 py-16 sm:py-20 text-white">
      {/* Decorative ambient gradients */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 size-80 rounded-full bg-violet/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 size-96 rounded-full bg-pink/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl max-w-3xl mx-auto leading-tight">
          Ready to Host or Attend Your Next Event?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base text-brand-100 sm:text-lg">
          Join thousands of attendees and event organizers across Bangladesh on Aayojon.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/events"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-white px-6 text-sm font-semibold text-brand-900 hover:bg-brand-50 shadow-md transition"
          >
            <Compass className="size-4 text-brand-700" />
            <span>Explore Events</span>
          </Link>
          <Link
            href="/organizer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-btn border border-brand-400/40 bg-brand-800/80 px-6 text-sm font-semibold text-white hover:bg-brand-700 transition"
          >
            <Sparkles className="size-4 text-pink" />
            <span>Start Organizing</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AboutContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 py-16 sm:py-20 bg-canvas">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-card border border-line bg-surface p-8 sm:p-10 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
              Get in Touch
            </span>
            <h3 className="text-2xl font-bold text-ink">Contact the Aayojon Team</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Have questions about organizing an event, listing your venue, or partner inquiries?
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-btn border border-line bg-canvas-alt p-5 flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-btn bg-brand-50 text-brand-600 border border-brand-200">
                <Mail className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">General & Partnerships</h4>
                <p className="text-xs text-ink-muted mt-1">support@ayojon.select</p>
                <p className="text-xs text-ink-muted mt-0.5">partners@ayojon.select</p>
              </div>
            </div>

            <div className="rounded-btn border border-line bg-canvas-alt p-5 flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-btn bg-purple-50 text-purple-600 border border-purple-200">
                <MapPin className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Headquarters</h4>
                <p className="text-xs text-ink-muted mt-1">Banani Commercial Area</p>
                <p className="text-xs text-ink-muted mt-0.5">Dhaka 1213, Bangladesh</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

