import React, { useState } from "react";
import { Link } from "@/components/ui/Link";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  ShieldAlert,
} from "lucide-react";
import { useAuth, DEMO_PERSONAS_LIST } from "@/lib/firebase/auth-context";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/layout/Logo";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/portal";

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
      navigate(returnUrl);
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
      if (personaId === "usr-superadmin" || personaId === "usr-admin-tariq") {
        navigate("/admin");
      } else {
        navigate(returnUrl);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to switch persona");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* LEFT: AUTH FORM */}
          <div className="md:col-span-6 bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
            <div className="text-center space-y-1">
              <div className="flex justify-center mb-2">
                <Logo size="md" showText={false} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                {mode === "signin" ? "Welcome back to Aayojon" : "Join Aayojon Bangladesh"}
              </h1>
              <p className="text-xs text-ink-muted">
                {mode === "signin"
                  ? "Sign in to manage bookings, tickets, and event operations"
                  : "Create an account to discover, organize, and purchase passes"}
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Full Name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-2.5 size-4 text-ink-muted" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rafiqul Islam"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 w-full rounded-btn border border-line bg-canvas-alt pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 size-4 text-ink-muted" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. attendee@aayojon.bd"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 w-full rounded-btn border border-line bg-canvas-alt pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 size-4 text-ink-muted" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 w-full rounded-btn border border-line bg-canvas-alt pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-btn bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition disabled:opacity-50"
              >
                <span>{loading ? "Authenticating..." : mode === "signin" ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="size-4" />
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                {mode === "signin" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </div>

          {/* RIGHT: ONE-CLICK QUICK PERSONA SWITCHER */}
          <div className="md:col-span-6 space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-0.5 text-xs font-bold text-purple-800">
                <Sparkles className="size-3" />
                <span>Instant Demo Persona Bridge</span>
              </div>
              <h2 className="text-xl font-bold text-ink">Test Real-Time RBAC Roles</h2>
              <p className="text-xs text-ink-muted">
                Select any verified role to authenticate immediately and test dynamic navigation & database RBAC access control.
              </p>
            </div>

            <div className="space-y-2">
              {/* SUPER ADMIN PERSONA */}
              <button
                type="button"
                onClick={() => handleQuickPersona("usr-superadmin")}
                className="w-full text-left p-3.5 rounded-2xl border-2 border-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition flex items-center justify-between shadow-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                    👑
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <span>Super Administrator (Root)</span>
                      <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-mono">
                        SUPER_ADMIN
                      </span>
                    </div>
                    <div className="text-[11px] text-purple-700">superadmin@aayojon.bd (Full Control)</div>
                  </div>
                </div>
                <ArrowRight className="size-4 text-purple-600 group-hover:translate-x-1 transition" />
              </button>

              {/* DEMO PERSONAS */}
              {DEMO_PERSONAS_LIST.map((p) => (
                <button
                  key={p.uid}
                  type="button"
                  onClick={() => handleQuickPersona(p.uid)}
                  className="w-full text-left p-3 rounded-2xl border border-line bg-surface hover:bg-canvas-alt transition flex items-center justify-between shadow-2xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold">
                      {p.role.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink">{p.displayName}</div>
                      <div className="text-[11px] text-ink-muted font-mono">{p.email} • {p.role.toUpperCase()}</div>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-ink-muted group-hover:text-brand-600 group-hover:translate-x-0.5 transition" />
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

