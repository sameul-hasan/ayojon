import { useMemo, useCallback, useState, useEffect } from "react";
import { useAuth, type UserRole } from "@/lib/firebase/auth-context";
import {
  hasRole,
  hasPermission,
  canAccessRoute,
  normalizeUserRole,
  isSuperAdmin as checkIsSuperAdmin,
  hasDbPermission,
  type Permission,
} from "@/lib/permissions/rbac";
import type { RoleDefinition } from "@/lib/types";
import { createInitialSeed } from "@/lib/seed";

export function usePermissions() {
  const { currentUser, firebaseUser, loading } = useAuth();
  const [dbRoles, setDbRoles] = useState<RoleDefinition[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Fetch dynamic database roles on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchRoles() {
      try {
        setLoadingRoles(true);
        const res = await fetch("/api/v1/roles");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.roles && data.roles.length > 0) {
            setDbRoles(data.roles);
            return;
          }
        }
      } catch (err) {
        // Fallback
      } finally {
        if (isMounted) setLoadingRoles(false);
      }
      // Ensure dbRoles is never empty on production / static domains
      if (isMounted) {
        setDbRoles(createInitialSeed().roles);
      }
    }
    fetchRoles();
    return () => {
      isMounted = false;
    };
  }, []);

  const role: UserRole | "guest" = useMemo(() => {
    if (!currentUser) return "guest";
    return normalizeUserRole(currentUser.role || currentUser.platform_role);
  }, [currentUser]);

  const isSuperAdmin = useMemo(() => {
    return checkIsSuperAdmin(currentUser);
  }, [currentUser]);

  const checkHasRole = useCallback(
    (allowedRoles: (UserRole | "guest")[]) => {
      // Superadmin can access any role-scoped view
      if (isSuperAdmin) return true;
      return hasRole(currentUser, allowedRoles);
    },
    [currentUser, isSuperAdmin]
  );

  const checkHasPermission = useCallback(
    (permission: Permission) => {
      if (isSuperAdmin) return true;
      return hasPermission(role, permission);
    },
    [role, isSuperAdmin]
  );

  const checkHasDbPermission = useCallback(
    (permission: string) => {
      if (isSuperAdmin) return true;
      return hasDbPermission(currentUser?.role || currentUser?.platform_role, permission, dbRoles);
    },
    [currentUser, dbRoles, isSuperAdmin]
  );

  const checkCanAccessRoute = useCallback(
    (pathname: string) => {
      if (isSuperAdmin) return { allowed: true };
      return canAccessRoute(pathname, currentUser);
    },
    [currentUser, isSuperAdmin]
  );

  const isSuspended = useMemo(() => {
    return (currentUser as any)?.status === "SUSPENDED";
  }, [currentUser]);

  return {
    currentUser,
    role,
    isSuperAdmin,
    dbRoles,
    loadingRoles,
    loading,
    isSuspended,
    hasRole: checkHasRole,
    hasPermission: checkHasPermission,
    hasDbPermission: checkHasDbPermission,
    canAccessRoute: checkCanAccessRoute,
    refreshRoles: async () => {
      try {
        const res = await fetch("/api/v1/roles");
        if (res.ok) {
          const data = await res.json();
          if (data.roles) setDbRoles(data.roles);
        }
      } catch (e) {}
    },
  };
}
