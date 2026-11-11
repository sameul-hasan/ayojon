"use client";

import React from "react";
import Link from "@/components/ui/Link";
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  LogIn,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface AccessDeniedViewProps {
  type?: "401" | "403" | "404" | "SUSPENDED";
  title?: string;
  message?: string;
  requiredRoles?: string[];
  returnUrl?: string;
}

export function AccessDeniedView({
  type = "403",
  title,
  message,
  requiredRoles,
  returnUrl = "/",
}: AccessDeniedViewProps) {
  if (type === "401") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center text-ink">
        <div className="rounded-card border border-line bg-surface p-8 max-w-md w-full shadow-card space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 border border-brand-200">
            <Lock className="size-7" />
          </div>
          <div>
            <Badge tone="brand">Authentication Required</Badge>
            <h2 className="mt-2 text-xl font-bold text-ink">
              {title || "Please Sign In to Access This Page"}
            </h2>
            <p className="mt-2 text-xs text-ink-muted leading-relaxed">
              {message ||
                "This workspace or resource is private to registered Aayojon accounts. Please sign in to verify your identity."}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}>
              <Button variant="primary" className="w-full gap-2">
                <LogIn className="size-4" /> Sign In to Aayojon
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="w-full">
                Return to Public Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (type === "SUSPENDED") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center text-ink">
        <div className="rounded-card border border-rose-200 bg-rose-50/50 p-8 max-w-md w-full shadow-card space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 border border-rose-300">
            <UserX className="size-7" />
          </div>
          <div>
            <Badge tone="danger">Account Suspended</Badge>
            <h2 className="mt-2 text-xl font-bold text-ink">
              {title || "Access Temporarily Suspended"}
            </h2>
            <p className="mt-2 text-xs text-ink-muted leading-relaxed">
              {message ||
                "This account has been suspended by Aayojon Platform Trust & Governance due to policy or verification requirements."}
            </p>
          </div>

          <div className="rounded-btn border border-line bg-surface p-3 text-[11px] text-ink-muted text-left">
            <span>For inquiries or appeals, contact our compliance team at <strong>compliance@aayojon.com.bd</strong></span>
          </div>

          <div className="pt-2">
            <Link href="/login">
              <Button variant="outline" size="sm" className="w-full">
                Sign In with Another Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (type === "404") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center text-ink">
        <div className="rounded-card border border-line bg-surface p-8 max-w-md w-full shadow-card space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-canvas-alt text-ink-muted border border-line">
            <HelpCircle className="size-7" />
          </div>
          <div>
            <Badge tone="neutral">Resource Unavailable</Badge>
            <h2 className="mt-2 text-xl font-bold text-ink">
              {title || "Page or Resource Not Found"}
            </h2>
            <p className="mt-2 text-xs text-ink-muted leading-relaxed">
              {message ||
                "The requested resource does not exist or you do not have permission to view its contents."}
            </p>
          </div>

          <div className="pt-2">
            <Link href="/">
              <Button variant="primary" className="w-full gap-2">
                <ArrowLeft className="size-4" /> Back to Safety
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default: 403 Access Denied
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center text-ink">
      <div className="rounded-card border border-amber-200 bg-surface p-8 max-w-md w-full shadow-card space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
          <ShieldAlert className="size-7" />
        </div>
        <div>
          <Badge tone="warning">Access Denied (403)</Badge>
          <h2 className="mt-2 text-xl font-bold text-ink">
            {title || "Insufficient Permissions"}
          </h2>
          <p className="mt-2 text-xs text-ink-muted leading-relaxed">
            {message ||
              "Your account role does not have authorization to view this workspace or perform this action."}
          </p>
        </div>

        {requiredRoles && requiredRoles.length > 0 && (
          <div className="rounded-btn border border-line bg-canvas-alt p-3 text-xs text-ink-muted">
            <span className="block text-[11px] font-semibold text-ink">Required Role(s):</span>
            <div className="mt-1 flex flex-wrap justify-center gap-1">
              {requiredRoles.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 uppercase"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2">
          <Link href="/">
            <Button variant="primary" className="w-full">
              Return to Homepage
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm" className="w-full">
              Sign In with Authorized Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

