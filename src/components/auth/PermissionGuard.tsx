"use client";

import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDeniedView } from "./AccessDeniedView";
import type { UserRole } from "@/lib/firebase/auth-context";
import type { Permission } from "@/lib/permissions/rbac";

export interface PermissionGuardProps {
  children: React.ReactNode;
  roles?: (UserRole | "guest")[];
  permission?: Permission;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

export function PermissionGuard({
  children,
  roles,
  permission,
  fallback = null,
  showAccessDenied = false,
}: PermissionGuardProps) {
  const { role, isSuspended, hasRole, hasPermission, loading } = usePermissions();

  if (loading) {
    return null;
  }

  if (isSuspended) {
    return showAccessDenied ? <AccessDeniedView type="SUSPENDED" /> : fallback;
  }

  if (roles && roles.length > 0) {
    if (!hasRole(roles)) {
      return showAccessDenied ? (
        <AccessDeniedView
          type={role === "guest" ? "401" : "403"}
          requiredRoles={roles.map((r) => r.toUpperCase())}
        />
      ) : fallback;
    }
  }

  if (permission) {
    if (!hasPermission(permission)) {
      return showAccessDenied ? (
        <AccessDeniedView
          type={role === "guest" ? "401" : "403"}
          message={`Action '${permission}' requires an elevated administrative or organizer role.`}
        />
      ) : fallback;
    }
  }

  return <>{children}</>;
}

