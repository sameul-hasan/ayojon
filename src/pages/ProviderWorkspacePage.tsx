import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProviderWorkspaceView } from "@/components/provider/ProviderWorkspaceView";
import { Building2 } from "lucide-react";

export function ProviderWorkspacePage() {
  return (
    <ProtectedRoute allowedRoles={["attendee", "organizer", "staff", "sponsor", "venue_owner", "vendor", "admin", "super_admin"]}>
      <div className="min-h-screen flex flex-col bg-canvas-alt text-ink">
        <Navbar activeHref="/provider" />

        <div className="border-b border-line bg-surface py-5 px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                <Building2 className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-ink">Provider Studio</h1>
                <p className="text-xs text-ink-muted">Manage venue spaces, service listings, quotation requests, and client bookings</p>
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <ProviderWorkspaceView />
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default ProviderWorkspacePage;

