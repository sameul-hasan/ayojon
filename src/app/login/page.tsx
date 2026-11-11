"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { useAuth, DEMO_PERSONAS_LIST } from "@/lib/firebase/auth-context";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/layout/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, switchPersona, currentUser } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("attendee");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name, role);
      }
      router.push("/portal");
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (personaId: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await switchPersona(personaId);
      router.push("/portal");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to switch persona.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas-alt text-ink">
      <PublicNavbar signInHref="/login" hostHref="/portal" />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center pb-1">
              <Logo size="xl" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-0.5 text-xs font-semibold text-brand-700">
              <Sparkles className="size-3.5" />
              <span>Firebase Identity & Persona Bridge</span>
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {mode === "signin" ? "Sign in to Aayojon" : "Create an Account"}
            </h1>
            <p className="text-xs text-ink-muted">
              Discover events, access entry passes, or manage your organization.
            </p>
          </div>

          <Card className="p-6 shadow-card space-y-5">
            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-btn border border-red-200 bg-red-50 p-3 text-xs text-danger"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Nusrat Jahan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="size-4" />}
                />
              )}

              <Input
                label="Email Address"
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="size-4" />}
              />

              <Input
                label="Password"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="size-4" />}
              />

              {mode === "signup" && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink">
                    I want to use Aayojon as:
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-11 rounded-btn border border-line bg-surface px-3 text-xs font-semibold text-ink focus:border-brand-600 focus:outline-none"
                  >
                    <option value="attendee">Attendee (Discover & Buy Tickets)</option>
                    <option value="organizer">Organizer (Host & Monetize Events)</option>
                    <option value="sponsor">Corporate Sponsor (Brand Placement)</option>
                  </select>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full text-xs font-bold"
                leftIcon={<KeyRound className="size-3.5" />}
              >
                {mode === "signin" ? "Sign In with Credentials" : "Create Account"}
              </Button>
            </form>

            <div className="text-center border-t border-line pt-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode(mode === "signin" ? "signup" : "signin");
                }}
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                {mode === "signin"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </Card>

          {/* QUICK DEMO PERSONAS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                Instant 1-Click Demo Personas
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {DEMO_PERSONAS_LIST.slice(0, 4).map((p) => (
                <button
                  key={p.uid}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickPersona(p.uid)}
                  className="rounded-btn border border-line bg-surface p-2.5 text-left hover:border-brand-600 transition shadow-xs flex flex-col justify-between"
                >
                  <div className="truncate">
                    <span className="font-bold text-ink block truncate">{p.displayName}</span>
                    <span className="text-[10px] text-ink-muted truncate block">{p.email}</span>
                  </div>
                  <Badge tone="brand" className="mt-1.5 text-[9px] uppercase self-start">
                    {p.role}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

