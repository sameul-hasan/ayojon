import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CheckInScannerView } from "@/components/CheckInScannerView";
import { useAuth } from "@/lib/firebase/auth-context";
import { fetchDatabaseState, dispatchStateAction } from "@/lib/client-api";
import type { DatabaseState } from "@/lib/types";
import { createInitialSeed } from "@/lib/seed";
import { ScanLine } from "lucide-react";

export function CheckInScannerPage() {
  const [searchParams] = useSearchParams();
  const { currentUser: authUser } = useAuth();
  const [db, setDb] = useState<DatabaseState>(() => createInitialSeed());
  const [loading, setLoading] = useState(true);

  const initialToken = searchParams.get("token") || "";
  const initialEventId = searchParams.get("eventId") || "";

  useEffect(() => {
    fetchDatabaseState()
      .then((data) => {
        setDb(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeUserId = authUser?.uid || authUser?.id || "usr-staff-tanvir";

  const handleAction = async (action: string, payload: Record<string, unknown>, overrideActorId?: string) => {
    const res = await dispatchStateAction(action, payload, overrideActorId || activeUserId);
    if (res.data) setDb(res.data);
    return res;
  };

  return (
    <ProtectedRoute allowedRoles={["staff", "organizer", "admin", "super_admin"]}>
      <div className="min-h-screen flex flex-col bg-canvas-alt text-ink">
        <Navbar activeHref="/scanner" />

        <div className="border-b border-line bg-surface py-5 px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <ScanLine className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-ink">Gate Check-In Terminal</h1>
                <p className="text-xs text-ink-muted">Cryptographic QR ticket scanner with double-entry fraud prevention</p>
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
            <CheckInScannerView
              db={db}
              initialToken={initialToken}
              initialEventId={initialEventId}
              onAction={handleAction}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default CheckInScannerPage;
