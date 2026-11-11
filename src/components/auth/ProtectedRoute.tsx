"use client";

import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDeniedView } from "./AccessDeniedView";
import type { UserRole } from "@/lib/firebase/auth-context";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectUnauthenticated?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectUnauthenticated = false,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { role, isSuspended, hasRole, loading } = usePermissions();

  useEffect(() => {
    if (!loading && role === "guest" && redirectUnauthenticated) {
      navigate(`/login?returnUrl=${encodeURIComponent(pathname || "/portal")}`);
    }
  }, [loading, role, redirectUnauthenticated, navigate, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="size-6 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isSuspended) {
    return <AccessDeniedView type="SUSPENDED" />;
  }

  if (role === "guest") {
    return (
      <AccessDeniedView
        type="401"
        returnUrl={pathname || "/portal"}
      />
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      return (
        <AccessDeniedView
          type="403"
          requiredRoles={allowedRoles.map((r) => r.toUpperCase())}
        />
      );
    }
  }

  return <>{children}</>;
}

