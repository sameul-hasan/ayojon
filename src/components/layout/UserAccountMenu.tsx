"use client";

import React, { useRef, useEffect } from "react";
import Link from "@/components/ui/Link";
import {
  User,
  LayoutDashboard,
  Ticket,
  Building,
  Handshake,
  QrCode,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/ui/cn";
import type { NormalizedRole } from "@/lib/permissions/rbac";

export interface UserAccountMenuProps {
  user: {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
    display_name?: string;
    photoURL?: string | null;
    avatar_url?: string;
    role?: string;
  };
  role: NormalizedRole;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSignOut: () => void;
  activeHref?: string;
}

export function UserAccountMenu({
  user,
  role,
  isOpen,
  onToggle,
  onClose,
  onSignOut,
  activeHref,
}: UserAccountMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      buttonRef.current?.focus();
    }
  };

  const displayName = user.displayName || user.display_name || user.email?.split("@")[0] || "Account";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Role-specific primary dashboard path and label
  const roleConfig: Record<NormalizedRole, { tab: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
    guest: { tab: "wallet", label: "Public Workspace", icon: LayoutDashboard },
    attendee: { tab: "wallet", label: "Attendee Wallet", icon: Ticket },
    organizer: { tab: "organizer", label: "Organizer Studio", icon: LayoutDashboard },
    sponsor: { tab: "sponsor", label: "Sponsor Hub", icon: Handshake },
    staff: { tab: "scanner", label: "Scanner Terminal", icon: QrCode },
    venue_owner: { tab: "provider", label: "Provider Studio", icon: Building },
    vendor: { tab: "provider", label: "Provider Studio", icon: Building },
    admin: { tab: "admin", label: "Admin Console", icon: ShieldAlert },
    super_admin: { tab: "admin", label: "Super Admin", icon: ShieldAlert },
  };

  const currentRoleConfig = roleConfig[role] || roleConfig.attendee;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <div
      ref={containerRef}
      className="relative inline-block text-left"
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className="flex items-center gap-2 rounded-btn border border-line bg-surface py-1.5 pl-2 pr-2.5 text-xs font-semibold text-ink hover:bg-canvas-alt shadow-xs transition focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        {user.photoURL || user.avatar_url ? (
          <img
            src={(user.photoURL || user.avatar_url)!}
            alt={displayName}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="size-7 rounded-full object-cover shrink-0 border border-brand-200"
          />
        ) : null}
        <span
          className={cn(
            "size-7 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 text-xs shrink-0 border border-brand-200",
            user.photoURL || user.avatar_url ? "hidden" : "flex"
          )}
        >
          {userInitials || <User className="size-3.5" />}
        </span>
        <div className="flex flex-col text-left">
          <span className="font-semibold text-ink text-xs max-w-[100px] truncate leading-tight">
            {displayName}
          </span>
          <span className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">
            {role.replace("_", " ")}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-3 text-ink-muted transition-transform duration-200 ml-0.5",
            isOpen ? "rotate-180 text-brand-700" : ""
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-card border border-line bg-surface p-1.5 shadow-pop backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User profile header badge */}
          <div className="border-b border-line px-3 py-2.5 mb-1">
            <p className="text-xs font-semibold text-ink truncate">{displayName}</p>
            {user.email && (
              <p className="text-[11px] text-ink-muted truncate">{user.email}</p>
            )}
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 uppercase">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>Role: {role.replace("_", " ")}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            {/* Primary role dashboard */}
            <Link
              href={`/${currentRoleConfig.tab}`}
              onClick={onClose}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-btn px-3 py-2 text-xs font-semibold text-ink hover:bg-canvas-alt hover:text-brand-700 transition"
            >
              <RoleIcon className="size-4 text-brand-600 shrink-0" />
              <div className="flex-1">
                <span>{currentRoleConfig.label}</span>
                <span className="block text-[10px] font-normal text-ink-muted">
                  Your primary workspace
                </span>
              </div>
            </Link>

            {/* If organizer/staff/admin, also provide attendee wallet link */}
            {role !== "attendee" && (
              <Link
                href="/wallet"
                onClick={onClose}
                role="menuitem"
                className="flex items-center gap-2.5 rounded-btn px-3 py-2 text-xs font-medium text-ink hover:bg-canvas-alt hover:text-brand-700 transition"
              >
                <Ticket className="size-4 text-ink-muted shrink-0" />
                <span>My Tickets & Wallet</span>
              </Link>
            )}

            {/* AI Assistant access */}
            <Link
              href="/ai-event-assistant"
              onClick={onClose}
              role="menuitem"
              className="flex items-center gap-2.5 rounded-btn px-3 py-2 text-xs font-medium text-ink hover:bg-canvas-alt hover:text-brand-700 transition"
            >
              <Sparkles className="size-4 text-brand-600 shrink-0" />
              <span>AI Event Assistant</span>
            </Link>

          </div>

          {/* Sign out */}
          <div className="border-t border-line mt-1.5 pt-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSignOut();
              }}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-btn px-3 py-2 text-xs font-semibold text-coral hover:bg-red-50 transition"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

