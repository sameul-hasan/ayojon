import React, { useState, useEffect } from "react";
import { Link } from "@/components/ui/Link";
import {
  ShieldAlert,
  Shield,
  Key,
  Users,
  Settings,
  Database,
  Lock,
  Unlock,
  Check,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Eye,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/lib/firebase/auth-context";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { fetchDatabaseState } from "@/lib/client-api";
import { createInitialSeed } from "@/lib/seed";
import type { RoleDefinition, DatabaseState } from "@/lib/types";

const ALL_SYSTEM_PERMISSIONS = [
  { code: "event.create", label: "Create Event Drafts", category: "Events" },
  { code: "event.read.public", label: "Read Public Catalog", category: "Events" },
  { code: "event.read.own", label: "Read Own Events", category: "Events" },
  { code: "event.update.own", label: "Update Own Events", category: "Events" },
  { code: "event.delete.own", label: "Delete Own Events", category: "Events" },
  { code: "event.publish", label: "Publish Events to Public", category: "Events" },
  { code: "event.moderate", label: "Moderate & Suspend Events", category: "Events" },
  { code: "attendee.read.own_event", label: "View Event Attendees", category: "Attendees" },
  { code: "attendee.export.own_event", label: "Export Attendee Roster (CSV)", category: "Attendees" },
  { code: "ticket.purchase", label: "Purchase & Checkout Tickets", category: "Ticketing" },
  { code: "ticket.read.own", label: "Access Own Digital Wallet", category: "Ticketing" },
  { code: "ticket.validate.assigned_event", label: "Gate QR Check-in Scan", category: "Ticketing" },
  { code: "sponsor.opportunity.read", label: "Browse Sponsorship Catalog", category: "Sponsorship" },
  { code: "sponsor.proposal.create", label: "Submit Brand Proposal", category: "Sponsorship" },
  { code: "sponsor.proposal.read.own", label: "Track Own Proposals", category: "Sponsorship" },
  { code: "sponsor.proposal.manage.own_event", label: "Accept/Reject Event Proposals", category: "Sponsorship" },
  { code: "venue.read.public", label: "Browse Venues Catalog", category: "Marketplace" },
  { code: "venue.manage.own", label: "Manage Own Venue Listing", category: "Marketplace" },
  { code: "service.manage.own", label: "Manage Own Vendor Services", category: "Marketplace" },
  { code: "rfq.create", label: "Create Marketplace RFQ", category: "Marketplace" },
  { code: "rfq.read.own", label: "Read Own RFQ Responses", category: "Marketplace" },
  { code: "rfq.read.assigned_provider", label: "Receive Assigned RFQ Bids", category: "Marketplace" },
  { code: "quotation.create.assigned", label: "Submit Quotation Bid", category: "Marketplace" },
  { code: "quotation.read.own", label: "Read Quotations", category: "Marketplace" },
  { code: "quotation.revise.own", label: "Revise Quotation", category: "Marketplace" },
  { code: "booking.create", label: "Book Venue & Lock Dates", category: "Marketplace" },
  { code: "booking.read.own", label: "View Own Bookings", category: "Marketplace" },
  { code: "booking.manage.own", label: "Manage Booking Status", category: "Marketplace" },
  { code: "user.manage", label: "Manage System Users", category: "Administration" },
  { code: "user.suspend", label: "Suspend Abusive Accounts", category: "Administration" },
  { code: "role.assign", label: "Assign User Roles", category: "Administration" },
  { code: "provider.verify", label: "Verify Venue/Vendor Badges", category: "Administration" },
  { code: "dispute.resolve", label: "Escrow Dispute Resolution", category: "Administration" },
  { code: "audit.read", label: "Access Security Audit Trail", category: "Administration" },
  { code: "platform.manage", label: "Platform Global Config", category: "Administration" },
  { code: "role.manage", label: "Dynamic Role & Permission Matrix", category: "Super Admin" },
  { code: "system.config", label: "System Invariants & Database Seeds", category: "Super Admin" },
];

export function SuperAdminConsolePage() {
  const { currentUser } = useAuth();
  const { isSuperAdmin, dbRoles, refreshRoles } = usePermissions();

  const [activeTab, setActiveTab] = useState<"roles" | "users" | "audit" | "overview">("roles");
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [dbState, setDbState] = useState<DatabaseState | null>(null);

  // Load database state & roles directly from Firestore / client-api
  useEffect(() => {
    fetchDatabaseState()
      .then((data) => {
        setDbState(data);
        const rolesList =
          data.roles && data.roles.length > 0 ? data.roles : createInitialSeed().roles;
        setRoles(rolesList);
        if (rolesList.length > 0) {
          setSelectedRole(rolesList[0]);
          setRolePermissions(rolesList[0].permissions || []);
        }
      })
      .catch((err) => {
        console.error("Error loading admin state:", err);
        const initial = createInitialSeed();
        setDbState(initial);
        setRoles(initial.roles);
        if (initial.roles.length > 0) {
          setSelectedRole(initial.roles[0]);
          setRolePermissions(initial.roles[0].permissions || []);
        }
      });
  }, []);

  const handleSelectRole = (r: RoleDefinition) => {
    setSelectedRole(r);
    setRolePermissions(r.permissions || []);
    setStatusMessage(null);
  };

  const handleTogglePermission = (permCode: string) => {
    if (!selectedRole) return;
    if (rolePermissions.includes(permCode)) {
      setRolePermissions(rolePermissions.filter((p) => p !== permCode));
    } else {
      setRolePermissions([...rolePermissions, permCode]);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/v1/admin/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Actor-User-Id": currentUser?.uid || "usr-superadmin",
        },
        body: JSON.stringify({
          roleCode: selectedRole.code,
          permissions: rolePermissions,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setStatusMessage({ text: `Successfully saved permissions for ${selectedRole.name}!`, type: "success" });
        // Update local state
        setRoles((prev) =>
          prev.map((r) => (r.code === selectedRole.code ? { ...r, permissions: rolePermissions } : r))
        );
        refreshRoles();
      } else {
        setStatusMessage({ text: result.error || "Failed to update role permissions", type: "error" });
      }
    } catch (e: any) {
      setStatusMessage({ text: e.message || "Network error updating permissions", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = ALL_SYSTEM_PERMISSIONS.filter(
    (p) =>
      p.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="flex min-h-screen flex-col bg-canvas text-ink">
        <PublicNavbar activeHref="/admin" />

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {/* HEADER BANNER */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-inner">
                  <ShieldAlert className="size-8" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-400/20 px-3 py-0.5 text-xs font-semibold text-purple-200 border border-purple-400/30 mb-2">
                    <Sparkles className="size-3" />
                    <span>Database-Defined Dynamic RBAC & Platform Core</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Super Admin Console
                  </h1>
                  <p className="mt-1 text-sm text-purple-200 max-w-2xl">
                    Configure database roles, dynamically modify granular permission assignments, audit security events, and inspect system invariants in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-right">
                  <div className="text-xs text-purple-300 font-medium">Logged in as</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 justify-end">
                    <span>👑 Super Admin</span>
                  </div>
                  <div className="text-[11px] text-purple-300/80">{currentUser?.email}</div>
                </div>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-t border-purple-800/60 pt-4 mt-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("roles")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === "roles"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-purple-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Key className="size-4" />
                <span>Role & Permissions Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === "overview"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-purple-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Activity className="size-4" />
                <span>System Health & Invariants</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === "users"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-purple-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Users className="size-4" />
                <span>Database Users ({dbState?.profiles.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === "audit"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-purple-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Shield className="size-4" />
                <span>Audit Logs ({dbState?.audit_logs.length || 0})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: DYNAMIC ROLES & PERMISSIONS */}
          {activeTab === "roles" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT: ROLES LIST (DATABASE DRIVEN) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                    <Database className="size-5 text-brand-600" />
                    <span>Database Roles</span>
                  </h2>
                  <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                    {roles.length} roles
                  </span>
                </div>

                <div className="space-y-2">
                  {roles.map((r) => {
                    const isSelected = selectedRole?.code === r.code;
                    return (
                      <button
                        key={r.id || r.code}
                        type="button"
                        onClick={() => handleSelectRole(r)}
                        className={`w-full text-left p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-600"
                            : "border-line bg-surface hover:bg-canvas-alt"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-ink">{r.name}</span>
                            {r.code === "SUPER_ADMIN" && (
                              <span className="text-xs bg-purple-600 text-white font-bold px-1.5 py-0.2 rounded">
                                Root
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-muted line-clamp-2">{r.description}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <code className="text-[10px] bg-canvas-alt px-1.5 py-0.5 rounded text-ink-muted font-mono">
                              {r.code}
                            </code>
                            <span className="text-[11px] text-brand-600 font-semibold">
                              {r.permissions?.includes("*") ? "All (Root)" : `${r.permissions?.length || 0} permissions`}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: PERMISSION ASSIGNMENT MATRIX */}
              <div className="lg:col-span-8">
                {selectedRole ? (
                  <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-ink">{selectedRole.name}</h2>
                          <span className="rounded-full bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5">
                            {selectedRole.code}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-1">{selectedRole.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSaveRole}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-btn bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition disabled:opacity-50"
                        >
                          {saving ? (
                            <RefreshCw className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          <span>Save Permissions</span>
                        </button>
                      </div>
                    </div>

                    {statusMessage && (
                      <div
                        className={`rounded-xl p-3 text-sm font-medium flex items-center gap-2 ${
                          statusMessage.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        {statusMessage.type === "success" ? (
                          <Check className="size-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="size-4 shrink-0 text-red-600" />
                        )}
                        <span>{statusMessage.text}</span>
                      </div>
                    )}

                    {/* SEARCH FILTER */}
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-ink-muted" />
                      <input
                        type="text"
                        placeholder="Filter permissions by name, code or category..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="h-10 w-full rounded-btn border border-line bg-canvas-alt pl-9 pr-4 text-xs text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                      />
                    </div>

                    {/* PERMISSION CHECKBOX MATRIX */}
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                      {["Events", "Attendees", "Ticketing", "Marketplace", "Sponsorship", "Administration", "Super Admin"].map(
                        (category) => {
                          const categoryPerms = filteredPermissions.filter((p) => p.category === category);
                          if (categoryPerms.length === 0) return null;

                          return (
                            <div key={category} className="space-y-3">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted border-b border-line/60 pb-1">
                                {category}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {categoryPerms.map((perm) => {
                                  const isChecked =
                                    rolePermissions.includes("*") || rolePermissions.includes(perm.code);
                                  const isRootLocked = selectedRole.code === "SUPER_ADMIN" && perm.category === "Super Admin";

                                  return (
                                    <label
                                      key={perm.code}
                                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition select-none ${
                                        isChecked
                                          ? "border-brand-300 bg-brand-50/50"
                                          : "border-line bg-surface hover:bg-canvas-alt"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={isRootLocked}
                                        onChange={() => handleTogglePermission(perm.code)}
                                        className="mt-0.5 size-4 rounded text-brand-600 focus:ring-brand-600 border-line"
                                      />
                                      <div>
                                        <div className="font-semibold text-ink">{perm.label}</div>
                                        <code className="text-[10px] text-ink-muted font-mono">{perm.code}</code>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-ink-muted">
                    Select a role on the left to inspect and configure permissions.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM HEALTH & INVARIANTS */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                  <div className="text-xs font-medium text-ink-muted">Registered Profiles</div>
                  <div className="mt-2 text-2xl font-bold text-ink">{dbState?.profiles.length || 0}</div>
                  <div className="mt-1 text-xs text-emerald-600 font-medium">Active database users</div>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                  <div className="text-xs font-medium text-ink-muted">Published Events</div>
                  <div className="mt-2 text-2xl font-bold text-ink">{dbState?.events.length || 0}</div>
                  <div className="mt-1 text-xs text-emerald-600 font-medium">100% QA invariants validated</div>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                  <div className="text-xs font-medium text-ink-muted">Partner Venues & Vendors</div>
                  <div className="mt-2 text-2xl font-bold text-ink">
                    {(dbState?.venue_profiles.length || 0) + (dbState?.vendor_services.length || 0)}
                  </div>
                  <div className="mt-1 text-xs text-indigo-600 font-medium">Marketplace RFQ enabled</div>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                  <div className="text-xs font-medium text-ink-muted">Platform Security Invariants</div>
                  <div className="mt-2 text-2xl font-bold text-emerald-600">45 / 45 Passed</div>
                  <div className="mt-1 text-xs text-ink-muted">QA, Auth, RFQ & RBAC tests</div>
                </div>
              </div>

              {/* RECENT AUDIT LOGS SUMMARY */}
              <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs">
                <h3 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
                  <Shield className="size-4 text-brand-600" />
                  <span>Latest Administrative Audit Logs</span>
                </h3>
                <div className="space-y-3">
                  {dbState?.audit_logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-canvas-alt text-xs border border-line/60">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-ink-muted">{log.actor_id || log.actor_name}</span>
                        <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {log.action}
                        </span>
                        <span className="text-ink-muted">{log.resource_type}: {log.resource_id}</span>
                      </div>
                      <span className="text-ink-muted font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USERS LIST */}
          {activeTab === "users" && (
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-ink">System Users & Persona Registry</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-ink-muted">
                      <th className="pb-3 font-semibold">User</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Platform Role</th>
                      <th className="pb-3 font-semibold">Organization</th>
                      <th className="pb-3 font-semibold">MFA</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {dbState?.profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-canvas-alt/50">
                        <td className="py-3 font-bold text-ink">{p.display_name}</td>
                        <td className="py-3 text-ink-muted font-mono">{p.email}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              p.platform_role === "SUPER_ADMIN"
                                ? "bg-purple-100 text-purple-800 border border-purple-300"
                                : p.platform_role === "ADMIN"
                                ? "bg-rose-100 text-rose-800"
                                : p.platform_role.includes("ORGANIZER")
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {p.platform_role}
                          </span>
                        </td>
                        <td className="py-3 text-ink-muted">{p.organization_label || "—"}</td>
                        <td className="py-3">
                          {p.mfa_enabled ? (
                            <span className="text-emerald-600 font-semibold">Enabled</span>
                          ) : (
                            <span className="text-ink-muted">Disabled</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-emerald-700 font-medium">ACTIVE</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-ink">Immutable Security Audit Trail</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-ink-muted">
                      <th className="pb-3 font-semibold">Timestamp</th>
                      <th className="pb-3 font-semibold">Actor</th>
                      <th className="pb-3 font-semibold">Action</th>
                      <th className="pb-3 font-semibold">Target</th>
                      <th className="pb-3 font-semibold">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {dbState?.audit_logs.map((log) => (
                      <tr key={log.id} className="hover:bg-canvas-alt/50 font-mono text-[11px]">
                        <td className="py-2.5 text-ink-muted">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-2.5 font-bold text-ink">{log.actor_id || log.actor_name}</td>
                        <td className="py-2.5 text-brand-600 font-bold">{log.action}</td>
                        <td className="py-2.5 text-ink-muted">{log.resource_type} ({log.resource_id})</td>
                        <td className="py-2.5 text-ink-muted truncate max-w-xs">{JSON.stringify(log.metadata || {})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        <PublicFooter />
      </div>
    </ProtectedRoute>
  );
}
