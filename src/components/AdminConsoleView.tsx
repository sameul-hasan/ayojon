"use client";

import React from "react";
import type { DatabaseState } from "@/lib/types";
import { AdminConsole } from "@/components/admin/AdminConsole";

interface AdminConsoleViewProps {
  db: DatabaseState;
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => Promise<unknown>;
}

export function AdminConsoleView({ db, onAction }: AdminConsoleViewProps) {
  return <AdminConsole db={db} onAction={onAction} />;
}
