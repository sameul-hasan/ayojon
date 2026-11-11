import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SponsorMarketplaceView } from "@/components/SponsorMarketplaceView";
import { useAuth } from "@/lib/firebase/auth-context";
import { fetchDatabaseState, dispatchStateAction } from "@/lib/client-api";
import type { DatabaseState, Profile } from "@/lib/types";
import { createInitialSeed } from "@/lib/seed";
import { Briefcase } from "lucide-react";

export function SponsorMarketplacePage() {
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

  const activeUserId = authUser?.uid || authUser?.id || "usr-sponsor-farhana";
  const currentUser: Profile = React.useMemo(() => {
    if (authUser) {
      const found = db.profiles.find(
        (p) => p.id === activeUserId || (authUser.email && p.email?.toLowerCase() === authUser.email.toLowerCase())
      );
      if (found) return found;
      return {
        id: authUser.uid,
        email: authUser.email || "",
        display_name: authUser.displayName || authUser.email?.split("@")[0] || "Sponsor",
        platform_role: authUser.platform_role || "SPONSOR",
        avatar_url: authUser.photoURL || undefined,
        phone: authUser.phone || "",
        organization_label: authUser.organization_label || "Corporate Sponsor",
        mfa_enabled: false,
        interests: authUser.interests || [],
        preferred_city: authUser.preferred_city || "Dhaka",
        created_at: authUser.created_at || new Date().toISOString(),
      };
    }
    return db.profiles[0];
  }, [authUser, activeUserId, db.profiles]);

  const handleAction = async (action: string, payload: Record<string, unknown>, overrideActorId?: string) => {
    const res = await dispatchStateAction(action, payload, overrideActorId || activeUserId);
    if (res.data) setDb(res.data);
    return res;
  };

  return (
    <ProtectedRoute allowedRoles={["sponsor", "admin", "super_admin"]}>
      <div className="min-h-screen flex flex-col bg-canvas-alt text-ink">
        <Navbar activeHref="/sponsor" />

        <div className="border-b border-line bg-surface py-5 px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 border border-violet-200 shadow-xs">
                <Briefcase className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-ink">Sponsor Marketplace</h1>
                <p className="text-xs text-ink-muted">Discover event sponsorship tiers, submit corporate bids, and track approvals</p>
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
            <SponsorMarketplaceView
              db={db}
              currentUser={currentUser}
              onAction={handleAction}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default SponsorMarketplacePage;

