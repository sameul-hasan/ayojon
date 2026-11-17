import React from "react";
import Link from "@/components/ui/Link";
import { Compass, Sparkles, Mail, MapPin } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";

export function AboutCTA() {
  const { currentUser } = useAuth();
  const canOrganize =
    currentUser?.role === "organizer" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "super_admin";
  const secondaryHref = canOrganize ? "/organizer" : currentUser ? "/profile" : "/login";
  const secondaryLabel = canOrganize
    ? "Open Organizer Studio"
    : currentUser
    ? "Apply to Organize"
    : "Sign In / Join";

  return (
    <section className="relative overflow-hidden border-y border-line bg-gradient-to-br from-brand-50 via-surface to-purple-50/60 py-16 sm:py-20 text-ink">
      {/* Decorative ambient gradients */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 size-80 rounded-full bg-violet/15 blur-3xl" />
        <div className="absolute right-0 bottom-0 size-96 rounded-full bg-pink/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl max-w-3xl mx-auto leading-tight text-ink">
          Ready to Host or Attend Your Next Event?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
          Join thousands of attendees and verified event organizers across Bangladesh on Aayojon.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/events"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 shadow-md transition"
          >
            <Compass className="size-4 text-white" />
            <span>Explore Events</span>
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-btn border border-line bg-surface px-6 text-sm font-semibold text-ink hover:bg-canvas-alt shadow-xs transition"
          >
            <Sparkles className="size-4 text-brand-600" />
            <span>{secondaryLabel}</span>
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

