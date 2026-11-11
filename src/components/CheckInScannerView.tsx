"use client";

import React from "react";
import type { DatabaseState } from "@/lib/types";
import { CheckInScanner } from "@/components/admin/CheckInScanner";

interface CheckInScannerViewProps {
  db: DatabaseState;
  initialToken?: string;
  initialEventId?: string;
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => Promise<unknown>;
}

export function CheckInScannerView({
  db,
  initialToken,
  initialEventId,
  onAction,
}: CheckInScannerViewProps) {
  return (
    <CheckInScanner
      db={db}
      initialToken={initialToken}
      initialEventId={initialEventId}
      onAction={onAction}
    />
  );
}
