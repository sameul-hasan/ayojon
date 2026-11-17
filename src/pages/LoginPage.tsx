import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Ticket,
  Eye,
  EyeOff,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Logo } from "@/components/layout/Logo";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const getRoleDestination = (roleStr?: string) => {
    switch (roleStr?.toLowerCase()) {
      case "organizer":
        return "/organizer";
      case "staff":
        return "/scanner";
      case "venue_owner":
      case "vendor":
        return "/provider";
      case "sponsor":
        return "/sponsor";
      case "admin":
      case "super_admin":
        return "/admin";
      default:
        return "/wallet";
    }
  };

  const { signInWithEmail, signInWithGoogle, signUpWithEmail, currentUser } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to their role workspace
  React.useEffect(() => {
    if (currentUser) {
      navigate(returnUrl || getRoleDestination(currentUser.role));
    }
  }, [currentUser, navigate, returnUrl]);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      // Navigation handled by currentUser useEffect using the resolved user role
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setErrorMsg(err?.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        // Navigation handled by currentUser useEffect using the resolved user role
      } else {
        await signUpWithEmail(email, password, name, "attendee");
        navigate(returnUrl || "/wallet");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT ENGAGING BRAND SHOWCASE (Desktop only, light brand theme) */}
          <div className="hidden lg:flex lg:col-span-6 rounded-3xl border border-line bg-gradient-to-br from-brand-50 via-surface to-purple-50/70 text-ink p-10 flex-col justify-between shadow-card relative overflow-hidden">
            <div className="absolute -top-24 -right-24 size-64 rounded-full bg-violet/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-pink/15 blur-3xl pointer-events-none" />

            <div className="relative space-y-6">
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-ink">
                  {mode === "signin"
                    ? "Your next unforgettable event starts here."
                    : "One account for every live experience in Bangladesh."}
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Discover concerts, tech summits, and workshops across Bangladesh. Manage instant QR passes, or apply from your Profile to host events, list venues, and partner with brands.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    icon: QrCode,
                    title: "Cryptographic QR Ticket Wallet",
                    desc: "Instant digital passes with offline gate verification and transfer protection.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Verified bKash, Nagad & Card Checkout",
                    desc: "Protected payment proof verification before ticket minting.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Admin-Verified Partner Roles",
                    desc: "Start as an Attendee, then apply in Profile for Organizer, Venue, Vendor, or Sponsor access.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-line bg-surface/90 p-3.5 shadow-2xs"
                    >
                      <div className="size-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
                        <Icon className="size-4 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink">{item.title}</p>
                        <p className="text-[11px] text-ink-muted leading-relaxed mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT AUTHENTICATION CARD */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-none bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-card flex flex-col justify-center space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-1">
                <Logo size="md" showText={false} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                {mode === "signin" ? "Welcome back to Aayojon" : "Join Aayojon Bangladesh"}
              </h1>
              <p className="text-xs text-ink-muted">
                {mode === "signin"
                  ? "Sign in to access your ticket wallet, bookings, and workspaces"
                  : "Create your Attendee account to discover events and book tickets"}
              </p>

              {/* Mode Toggle Buttons */}
              <div className="grid grid-cols-2 gap-1 rounded-btn bg-canvas-alt p-1 border border-line mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-btn transition cursor-pointer ${
                    mode === "signin"
                      ? "bg-surface text-ink shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-btn transition cursor-pointer ${
                    mode === "signup"
                      ? "bg-surface text-ink shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2.5 rounded-btn border border-line bg-canvas-alt py-2.5 text-xs font-semibold text-ink shadow-2xs hover:bg-canvas-alt/80 hover:border-line-strong transition disabled:opacity-50"
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            <span>{mode === "signin" ? "Sign in with Google" : "Sign up with Google"}</span>
          </button>

          <div className="relative flex items-center justify-center -my-2">
            <div className="border-t border-line w-full" />
            <span className="bg-surface px-2 text-[10px] uppercase font-bold text-ink-muted">
              or continue with email
            </span>
            <div className="border-t border-line w-full" />
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
                    placeholder="e.g. Rahim Ahmed"
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
                  placeholder="name@example.com"
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
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-btn border border-line bg-canvas-alt pl-9 pr-10 text-xs text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-2.5 text-ink-muted hover:text-ink transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="rounded-btn border border-brand-200 bg-brand-50/60 p-3 flex items-start gap-2.5 text-xs text-ink">
                <Ticket className="size-4 text-brand-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-ink">Standard Attendee Account</p>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    All new accounts start as <strong>Attendee</strong>. Need Organizer, Venue Partner, Vendor, Sponsor, or Staff access? Apply separately from your <strong>Profile</strong> after signing in for Admin verification.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-btn bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Authenticating..." : mode === "signin" ? "Sign In" : "Create Account"}</span>
              <ArrowRight className="size-4" />
            </button>
          </form>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
