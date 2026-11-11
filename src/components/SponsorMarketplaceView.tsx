"use client";

import React from "react";
import type { DatabaseState, Profile } from "@/lib/types";
import { SponsorMarketplace } from "@/components/sponsor/SponsorMarketplace";

interface SponsorMarketplaceViewProps {
  db: DatabaseState;
  currentUser: Profile;
  onAction: (
    action: string,
    payload: Record<string, unknown>,
    overrideActorId?: string
  ) => Promise<unknown>;
}

export function SponsorMarketplaceView({
  db,
  currentUser,
  onAction,
}: SponsorMarketplaceViewProps) {
  return (
    <SponsorMarketplace
      db={db}
      currentUser={currentUser}
      onAction={onAction}
    />
  );
}
