"use client";

import React from "react";
import type { DatabaseState, Profile } from "@/lib/types";
import { AttendeeWallet } from "@/components/attendee/AttendeeWallet";

interface AttendeeWalletViewProps {
  db: DatabaseState;
  currentUser: Profile;
  onSendToScanner: (qrToken: string, eventId: string) => void;
  onVerifyPendingOrder: (orderId: string) => Promise<void>;
}

/**
 * Redesigned AttendeeWalletView.
 * Drop-in replacement for the portal tab, preserving exact props and handlers.
 */
export function AttendeeWalletView({
  db,
  currentUser,
  onSendToScanner,
  onVerifyPendingOrder,
}: AttendeeWalletViewProps) {
  return (
    <AttendeeWallet
      db={db}
      currentUser={currentUser}
      onSendToScanner={onSendToScanner}
      onVerifyPendingOrder={onVerifyPendingOrder}
    />
  );
}
