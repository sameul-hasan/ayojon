import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  Ticket,
  Calendar,
  Handshake,
  Sparkles,
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
  const [role, setRole] = useState("attendee");
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
      navigate(returnUrl || getRoleDestination(role));
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
      } else {
        await signUpWithEmail(email, password, name, role);
      }
      navigate(returnUrl || getRoleDestination(role));
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <Logo size="md" showText={false} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {mode === "signin" ? "Welcome back to Aayojon" : "Join Aayojon Bangladesh"}
            </h1>
            <p className="text-xs text-ink-muted">
              {mode === "signin"
                ? "Sign in to manage bookings, tickets, and event operations"
                : "Create an account to discover, organize, or sponsor events"}
            </p>

            {/* Mode Toggle Buttons */}
            <div className="grid grid-cols-2 gap-1 rounded-btn bg-canvas-alt p-1 border border-line mt-4">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-btn transition ${
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
                className={`py-1.5 text-xs font-semibold rounded-btn transition ${
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
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-btn border border-line bg-canvas-alt pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Select Account Type / Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: "attendee", label: "Attendee", icon: Ticket, desc: "Buy tickets & join" },
                    { id: "organizer", label: "Organizer", icon: Calendar, desc: "Host events" },
                    { id: "venue_owner", label: "Venue Partner", icon: Building2, desc: "List venues" },
                    { id: "sponsor", label: "Sponsor", icon: Handshake, desc: "Brand placement" },
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`text-left p-2.5 rounded-btn border transition flex items-center gap-2.5 ${
                          isSelected
                            ? "border-brand-600 bg-brand-50/60 text-brand-700"
                            : "border-line bg-canvas-alt text-ink hover:border-line-strong"
                        }`}
                      >
                        <Icon className={`size-4 shrink-0 ${isSelected ? "text-brand-600" : "text-ink-muted"}`} />
                        <div>
                          <div className="text-xs font-semibold leading-tight">{r.label}</div>
                          <div className="text-[10px] text-ink-muted">{r.desc}</div>
                        </div>
                      </button>
                    );
                  })}
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

          <div className="pt-2 border-t border-line text-center">
            <p className="text-[11px] text-ink-muted flex items-center justify-center gap-1">
              <ShieldCheck className="size-3.5 text-brand-600" />
              <span>Secured by Firebase Authentication & RBAC</span>
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
