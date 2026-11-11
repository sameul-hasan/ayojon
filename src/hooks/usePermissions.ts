"use client";

import { useMemo, useCallback } from "react";
import { useAuth, type UserRole } from "@/lib/firebase/auth-context";
import {
  hasRole,
  hasPermission,
  canAccessRoute,
  normalizeUserRole,
  type Permission,
} from "@/lib/permissions/rbac";

export function usePermissions() {
  const { currentUser, firebaseUser, loading } = useAuth();

  const role: UserRole | "guest" = useMemo(() => {
    if (!currentUser) return "guest";
    return normalizeUserRole(currentUser.role || currentUser.platform_role);
  }, [currentUser]);

  const checkHasRole = useCallback(
    (allowedRoles: (UserRole | "guest")[]) => {
      return hasRole(currentUser, allowedRoles);
    },
    [currentUser]
  );

  const checkHasPermission = useCallback(
    (permission: Permission) => {
      return hasPermission(role, permission);
    },
    [role]
  );

  const checkCanAccessRoute = useCallback(
    (pathname: string) => {
      return canAccessRoute(pathname, currentUser);
    },
    [currentUser]
  );

  const isSuspended = useMemo(() => {
    // Check if account status is marked suspended
    return (currentUser as any)?.status === "SUSPENDED";
  }, [currentUser]);

  return {
    currentUser,
    role,
    loading,
    isSuspended,
    hasRole: checkHasRole,
    hasPermission: checkHasPermission,
    canAccessRoute: checkCanAccessRoute,
  };
}

