import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AttendeeWalletView } from "@/components/AttendeeWalletView";
import { useAuth } from "@/lib/firebase/auth-context";
import { fetchDatabaseState, dispatchStateAction } from "@/lib/client-api";
import type { DatabaseState, Profile } from "@/lib/types";
import { createInitialSeed } from "@/lib/seed";
import { Ticket, Sparkles } from "lucide-react";

export function AttendeeWalletPage() {
  const navigate = useNavigate();
  const { currentUser: authUser } = useAuth();
  const [db, setDb] = useState<DatabaseState>(() => createInitialSeed());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatabaseState()
      .then((data) => {
        setDb(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeUserId = authUser?.uid || authUser?.id || "usr-attendee-rafiq";
  const currentUser: Profile = React.useMemo(() => {
    if (authUser) {
      const found = db.profiles.find(
        (p) => p.id === activeUserId || (authUser.email && p.email?.toLowerCase() === authUser.email.toLowerCase())
      );
      if (found) return found;
      return {
        id: authUser.uid,
        email: authUser.email || "",
        display_name: authUser.displayName || authUser.email?.split("@")[0] || "User",
        platform_role: authUser.platform_role || "ATTENDEE",
        avatar_url: authUser.photoURL || undefined,
        phone: authUser.phone || "",
        organization_label: authUser.organization_label || "",
        mfa_enabled: false,
        interests: authUser.interests || [],
        preferred_city: authUser.preferred_city || "Dhaka",
        created_at: authUser.created_at || new Date().toISOString(),
      };
    }
    return db.profiles[0];
  }, [authUser, activeUserId, db.profiles]);

  return (
    <ProtectedRoute allowedRoles={["attendee", "organizer", "staff", "sponsor", "venue_owner", "vendor", "admin", "super_admin"]}>
      <div className="min-h-screen flex flex-col bg-canvas-alt text-ink">
        <Navbar activeHref="/wallet" />

        <div className="border-b border-line bg-surface py-5 px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shadow-xs">
                <Ticket className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-ink">My Ticket Wallet</h1>
                <p className="text-xs text-ink-muted">View your active admission passes, cryptographic QR tickets, and receipts</p>
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="size-8 rounded-full border-3 border-brand-600 border-t-transparent animate-spin" />
            </div>
          ) : (
            <AttendeeWalletView
              db={db}
              currentUser={currentUser}
              onSendToScanner={(token, eventId) => {
                navigate(`/scanner?token=${encodeURIComponent(token)}&eventId=${encodeURIComponent(eventId)}`);
              }}
              onVerifyPendingOrder={async (orderId) => {
                const res = await dispatchStateAction("VERIFY_PENDING_ORDER_WEBHOOK", { orderId }, activeUserId);
                if (res.data) setDb(res.data);
              }}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default AttendeeWalletPage;

