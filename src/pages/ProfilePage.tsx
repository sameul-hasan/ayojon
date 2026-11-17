"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/firebase/auth-context";
import { usePermissions } from "@/hooks/usePermissions";
import { dispatchStateAction, clientGetRoleApplications } from "@/lib/client-api";
import type { RoleApplication, RoleApplicationTarget } from "@/lib/types";
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Sparkles,
  Check,
  CheckCircle2,
  AlertCircle,
  Save,
  Ticket,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Camera,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight,
  Briefcase,
  Store,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/ui/cn";

const CITIES = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Online",
];

const INTEREST_TAGS = [
  "Technology",
  "AI & Workshops",
  "Startups",
  "Music & Concerts",
  "Business & Networking",
  "Conferences & Summits",
  "Art & Culture",
  "University Clubs",
  "Design & Creative",
  "Sports & Gaming",
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile, signOutUser, loading: authLoading } = useAuth();
  const { role, isSuperAdmin } = usePermissions();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [preferredCity, setPreferredCity] = useState("Dhaka");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  // Role application state
  const [roleApps, setRoleApps] = useState<RoleApplication[]>([]);
  const [applyTargetRole, setApplyTargetRole] = useState<RoleApplicationTarget>("ORGANIZER_OWNER");
  const [applyOrgName, setApplyOrgName] = useState("");
  const [applyJustification, setApplyJustification] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyMessage, setApplyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || currentUser.display_name || "");
      setPhone(currentUser.phone || "");
      setOrganization(currentUser.organization_label || "");
      setPreferredCity(currentUser.preferred_city || "Dhaka");
      setAvatarUrl(currentUser.photoURL || currentUser.avatar_url || "");
      setInterests(currentUser.interests || ["Technology", "Startups"]);
      setApplyOrgName(currentUser.organization_label || "");
      clientGetRoleApplications()
        .then((apps) => {
          setRoleApps(apps.filter((a) => a.user_id === currentUser.uid));
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await updateUserProfile({
        display_name: displayName.trim() || currentUser.email?.split("@")[0] || "User",
        phone: phone.trim(),
        organization_label: organization.trim(),
        preferred_city: preferredCity,
        avatar_url: avatarUrl.trim() || undefined,
        interests,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyForRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setApplySubmitting(true);
    setApplyMessage(null);
    try {
      const res = (await dispatchStateAction(
        "SUBMIT_ROLE_APPLICATION",
        {
          userId: currentUser.uid,
          applicantName: displayName || currentUser.displayName || currentUser.email,
          applicantEmail: currentUser.email,
          applicantPhone: phone,
          requestedRole: applyTargetRole,
          organizationName: applyOrgName,
          justification: applyJustification,
        },
        currentUser.uid
      )) as { result?: RoleApplication };
      if (res?.result) {
        setRoleApps((prev) => [res.result!, ...prev]);
      }
      setApplyJustification("");
      setApplyMessage({
        type: "success",
        text: "Application submitted! Platform Admins have been notified to verify and approve your requested position.",
      });
    } catch (err: any) {
      setApplyMessage({
        type: "error",
        text: err?.message || "Could not submit role application.",
      });
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    navigate("/");
  };

  const roleLabelMap: Record<string, { label: string; badge: string; color: string }> = {
    super_admin: { label: "Super Administrator", badge: "Platform SuperAdmin", color: "bg-purple-50 text-purple-700 border-purple-200" },
    admin: { label: "Administrator", badge: "Administrator", color: "bg-blue-50 text-blue-700 border-blue-200" },
    organizer: { label: "Event Organizer", badge: "Organizer", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    staff: { label: "Check-in Staff", badge: "Gate Staff", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    venue_owner: { label: "Venue Provider", badge: "Venue Partner", color: "bg-amber-50 text-amber-700 border-amber-200" },
    vendor: { label: "Service Vendor", badge: "Vendor", color: "bg-orange-50 text-orange-700 border-orange-200" },
    sponsor: { label: "Corporate Sponsor", badge: "Sponsor Partner", color: "bg-violet-50 text-violet-700 border-violet-200" },
    attendee: { label: "Event Attendee", badge: "Attendee", color: "bg-teal-50 text-teal-700 border-teal-200" },
  };

  const currentRoleInfo = roleLabelMap[role] || roleLabelMap.attendee;

  return (
    <ProtectedRoute allowedRoles={["attendee", "organizer", "staff", "sponsor", "venue_owner", "vendor", "admin", "super_admin"]}>
      <div className="min-h-screen flex flex-col bg-canvas-alt text-ink">
        <Navbar activeHref="/profile" />

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          {/* 1. HERO USER HEADER */}
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-card mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar with fallback */}
              <div className="relative group shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || "User"}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="size-24 sm:size-28 rounded-2xl object-cover border-2 border-line shadow-sm"
                  />
                ) : null}
                <div
                  className={cn(
                    "size-24 sm:size-28 items-center justify-center rounded-2xl bg-brand-600 text-3xl font-extrabold text-white shadow-sm",
                    avatarUrl ? "hidden" : "flex"
                  )}
                >
                  {displayName ? displayName.slice(0, 2).toUpperCase() : "US"}
                </div>
                <div className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-xs">
                  <ShieldCheck className="size-4" />
                </div>
              </div>

              {/* Identity Info */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-ink">
                    {displayName || "User Profile"}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
                      currentRoleInfo.color
                    )}
                  >
                    {currentRoleInfo.badge}
                  </span>
                </div>

                <p className="text-sm text-ink-muted flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="size-4 text-ink-muted shrink-0" />
                  <span>{currentUser?.email}</span>
                </p>

                {organization && (
                  <p className="text-xs text-ink-muted flex items-center justify-center sm:justify-start gap-2">
                    <Building className="size-3.5 text-ink-muted shrink-0" />
                    <span>{organization}</span>
                  </p>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <Link
                    to="/wallet"
                    className="inline-flex items-center gap-1.5 rounded-btn border border-line bg-canvas-alt px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition shadow-2xs"
                  >
                    <Ticket className="size-3.5 text-teal-600" />
                    <span>My Ticket Wallet</span>
                  </Link>

                  {(role === "organizer" || role === "admin" || isSuperAdmin) && (
                    <Link
                      to="/organizer"
                      className="inline-flex items-center gap-1.5 rounded-btn border border-line bg-canvas-alt px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition shadow-2xs"
                    >
                      <Calendar className="size-3.5 text-blue-600" />
                      <span>Organizer Studio</span>
                    </Link>
                  )}

                  {(role === "venue_owner" || role === "vendor" || role === "admin" || isSuperAdmin) && (
                    <Link
                      to="/provider"
                      className="inline-flex items-center gap-1.5 rounded-btn border border-line bg-canvas-alt px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition shadow-2xs"
                    >
                      <Store className="size-3.5 text-amber-600" />
                      <span>Provider Workspace</span>
                    </Link>
                  )}

                  {(role === "sponsor" || role === "admin" || isSuperAdmin) && (
                    <Link
                      to="/sponsor"
                      className="inline-flex items-center gap-1.5 rounded-btn border border-line bg-canvas-alt px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition shadow-2xs"
                    >
                      <Sparkles className="size-3.5 text-violet-600" />
                      <span>Sponsor Hub</span>
                    </Link>
                  )}

                  {isSuperAdmin && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1.5 rounded-btn border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
                    >
                      <ShieldAlert className="size-3.5 text-purple-600" />
                      <span>Admin Console</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. SUCCESS & ERROR NOTIFICATIONS */}
          {saveSuccess && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-xs animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <span>Profile updated successfully! All changes have been saved to your account in Cloud Firestore.</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-danger shadow-xs animate-in fade-in">
              <AlertCircle className="size-5 text-danger shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 3. PROFILE EDIT FORM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-card">
                <div className="border-b border-line pb-4 mb-6">
                  <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                    <User className="size-5 text-brand-600" />
                    <span>Personal Information & Edit Access</span>
                  </h2>
                  <p className="text-xs text-ink-muted mt-1">
                    Update your account details. Any changes you make are instantly synchronized with Cloud Firestore.
                  </p>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                      Full Name / Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Sameul Hasan"
                      required
                      className="w-full rounded-btn border border-line bg-canvas-alt px-4 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-surface focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  {/* Email (Read only) */}
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                      Account Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={currentUser?.email || ""}
                        disabled
                        className="w-full rounded-btn border border-line bg-canvas-alt/50 px-4 py-2.5 text-sm text-ink-muted cursor-not-allowed opacity-80"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Authenticated
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-1">
                      Email address is managed by your Google or Firebase credentials.
                    </p>
                  </div>

                  {/* Phone & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+880 1700 000000"
                        className="w-full rounded-btn border border-line bg-canvas-alt px-4 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-surface focus:outline-none transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                        Preferred City
                      </label>
                      <select
                        value={preferredCity}
                        onChange={(e) => setPreferredCity(e.target.value)}
                        className="w-full rounded-btn border border-line bg-canvas-alt px-4 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-surface focus:outline-none transition shadow-2xs"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Organization / Institute */}
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                      Organization, Institute, or Company
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. BUET, NSU, Dhaka Tech Club, Freelance"
                      className="w-full rounded-btn border border-line bg-canvas-alt px-4 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-surface focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  {/* Profile Avatar URL */}
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                      Profile Photo URL
                    </label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or Google photo URL"
                      className="w-full rounded-btn border border-line bg-canvas-alt px-4 py-2.5 text-sm text-ink focus:border-brand-600 focus:bg-surface focus:outline-none transition shadow-2xs"
                    />
                    <p className="text-[11px] text-ink-muted mt-1">
                      Direct link to an image. If left blank, your Google account avatar or initials are displayed.
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-ink-muted">Quick presets:</span>
                      {[
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80",
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(preset)}
                          className={cn(
                            "size-7 rounded-full overflow-hidden border-2 transition hover:scale-110",
                            avatarUrl === preset ? "border-brand-600 ring-2 ring-brand-500/30" : "border-line"
                          )}
                          title={`Select avatar preset ${idx + 1}`}
                        >
                          <img src={preset} alt={`Preset ${idx + 1}`} className="size-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Event Interests */}
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                      Event Interests & Topics
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {INTEREST_TAGS.map((tag) => {
                        const selected = interests.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleInterest(tag)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95",
                              selected
                                ? "bg-brand-600 text-white shadow-xs"
                                : "border border-line bg-canvas-alt text-ink-muted hover:border-brand-300 hover:text-ink"
                            )}
                          >
                            {selected ? (
                              <>
                                <Check className="size-3" />
                                <span>{tag}</span>
                              </>
                            ) : (
                              <span>+ {tag}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Account Role Summary (Read-Only) */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between rounded-2xl border border-line bg-canvas-alt p-4">
                      <div>
                        <p className="text-xs font-bold text-ink uppercase tracking-wider">
                          Verified Account Role
                        </p>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          Higher authority roles (Organizer, Venue Partner, Vendor, Sponsor, Staff) require Admin verification.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200 shrink-0">
                        {currentRoleInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-btn bg-brand-600 hover:bg-brand-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-transform duration-200 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="size-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* ROLE APPLICATION CARD (SEPARATE FROM PROFILE SAVE) */}
              <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-card space-y-5">
                <div className="border-b border-line pb-4">
                  <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                    <ShieldCheck className="size-5 text-brand-600" />
                    <span>Apply for Organizer or Partner Position</span>
                  </h2>
                  <p className="text-xs text-ink-muted mt-1">
                    Higher authority roles cannot be self-assigned. Submit an application below and a Platform Admin will verify and approve your position.
                  </p>
                </div>

                {applyMessage && (
                  <div
                    className={cn(
                      "rounded-xl border p-3 text-xs font-medium flex items-center gap-2",
                      applyMessage.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-red-200 bg-red-50 text-red-700"
                    )}
                  >
                    {applyMessage.type === "success" ? (
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="size-4 text-red-600 shrink-0" />
                    )}
                    <span>{applyMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleApplyForRole} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                      Select Account Type / Role to Apply For
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {[
                        { id: "ORGANIZER_OWNER" as RoleApplicationTarget, label: "Organizer", icon: Calendar, desc: "Host events & sell tickets" },
                        { id: "VENUE_OWNER" as RoleApplicationTarget, label: "Venue Partner", icon: Store, desc: "List halls & venues" },
                        { id: "VENDOR" as RoleApplicationTarget, label: "Service Vendor", icon: Briefcase, desc: "AV, catering & stage" },
                        { id: "SPONSOR" as RoleApplicationTarget, label: "Sponsor", icon: Sparkles, desc: "Brand placement" },
                        { id: "CHECKIN_STAFF" as RoleApplicationTarget, label: "Gate Staff", icon: ShieldCheck, desc: "QR gate check-in" },
                      ].map((r) => {
                        const Icon = r.icon;
                        const isSelected = applyTargetRole === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setApplyTargetRole(r.id)}
                            className={cn(
                              "text-left p-3 rounded-2xl border transition flex items-center gap-2.5 cursor-pointer",
                              isSelected
                                ? "border-brand-600 bg-brand-50/60 text-brand-700 ring-1 ring-brand-500/20"
                                : "border-line bg-canvas-alt text-ink hover:border-brand-300"
                            )}
                          >
                            <div
                              className={cn(
                                "size-8 rounded-xl flex items-center justify-center border shrink-0",
                                isSelected
                                  ? "bg-brand-600 text-white border-brand-700"
                                  : "bg-surface text-ink-muted border-line"
                              )}
                            >
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold leading-tight">{r.label}</div>
                              <div className="text-[10px] text-ink-muted truncate">{r.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Organization / Brand / Venue Name
                    </label>
                    <input
                      type="text"
                      required
                      value={applyOrgName}
                      onChange={(e) => setApplyOrgName(e.target.value)}
                      placeholder="e.g. Dhaka Tech Events"
                      className="w-full rounded-btn border border-line bg-canvas-alt px-3 py-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                      Verification Details &amp; Justification
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={applyJustification}
                      onChange={(e) => setApplyJustification(e.target.value)}
                      placeholder="Describe your organization, past events or venue/vendor credentials, website or trade license reference for Admin verification..."
                      className="w-full rounded-btn border border-line bg-canvas-alt px-3 py-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={applySubmitting}
                      className="inline-flex items-center gap-2 rounded-btn bg-ink hover:bg-ink/90 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                    >
                      <span>{applySubmitting ? "Submitting..." : "Submit Application for Admin Verification"}</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </form>

                {roleApps.length > 0 && (
                  <div className="pt-4 border-t border-line space-y-2.5">
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                      Your Role Applications
                    </h3>
                    {roleApps.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-xl border border-line bg-canvas-alt p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <p className="font-bold text-ink">
                            {app.requested_role} — {app.organization_name}
                          </p>
                          <p className="text-[11px] text-ink-muted line-clamp-1">
                            {app.justification}
                          </p>
                          {app.review_note && (
                            <p className="text-[11px] text-ink mt-0.5">
                              Admin Note: {app.review_note}
                            </p>
                          )}
                        </div>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 self-start sm:self-center",
                            app.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. SIDEBAR ACCOUNT SUMMARY */}
            <div className="space-y-6">
              {/* Account Security Card */}
              <div className="rounded-3xl border border-line bg-surface p-6 shadow-card space-y-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>Account & Role Security</span>
                </h3>

                <div className="rounded-2xl border border-line bg-canvas-alt/60 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Account Status:</span>
                    <span className="font-bold text-emerald-700">Active & Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Assigned Role:</span>
                    <span className="font-bold text-ink">{currentRoleInfo.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">User ID:</span>
                    <span className="font-mono text-[10px] text-ink-muted truncate max-w-[150px]">
                      {currentUser?.uid}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-ink-muted leading-relaxed">
                  Your permissions and studio access are scoped strictly to your verified role ({currentRoleInfo.label}).
                </p>
              </div>

              {/* Sign Out Card */}
              <div className="rounded-3xl border border-line bg-surface p-6 shadow-card space-y-3">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider text-rose-600 flex items-center gap-2">
                  <LogOut className="size-4" />
                  <span>Session Management</span>
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Sign out from your active session on this device.
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 rounded-btn border border-rose-200 bg-rose-50/70 hover:bg-rose-100 py-2.5 text-xs font-bold text-rose-700 transition active:scale-95"
                >
                  <LogOut className="size-4" />
                  <span>Sign Out of Aayojon</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </div>
    </ProtectedRoute>
  );
}

export default ProfilePage;

