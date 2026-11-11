import React from "react";
import { Link } from "@/components/ui/Link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Compass, ArrowRight } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="size-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Compass className="size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">404 — Page Not Found</h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            The page you are looking for doesn't exist or may have been moved.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-btn bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition"
            >
              <span>Back to Home</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

