"use client";

import React, { useState } from "react";
import { LocateFixed } from "lucide-react";
import type { PublicCategory, PublicEvent } from "@/lib/public-events-shared";
import { EventCard } from "./EventCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

type State = "idle" | "locating" | "done" | "denied" | "unsupported";

/** Location is requested only after the user clicks, and is never sent to a server. */
export function NearYou({ events, categories }: { events: PublicEvent[]; categories: PublicCategory[] }) {
  const [state, setState] = useState<State>("idle");
  const [nearby, setNearby] = useState<Array<{ event: PublicEvent; km: number }>>([]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const hasGeo = events.some((e) => e.lat !== null && e.lng !== null);

  if (!hasGeo) return null;

  const locate = () => {
    if (!("geolocation" in navigator)) return setState("unsupported");
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const list = events
          .filter((e) => e.lat !== null && e.lng !== null)
          .map((e) => ({ event: e, km: haversineKm(pos.coords.latitude, pos.coords.longitude, e.lat!, e.lng!) }))
          .sort((a, b) => a.km - b.km)
          .slice(0, 4);
        setNearby(list);
        setState("done");
      },
      () => setState("denied"),
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div>
      {state !== "done" && (
        <div className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted" role="status">
            {state === "denied"
              ? "Location permission was denied. You can still browse by city using search."
              : state === "unsupported"
                ? "Your browser does not support location."
                : "Share your location to see the closest in-person events. It stays on your device."}
          </p>
          <Button variant="secondary" loading={state === "locating"} leftIcon={<LocateFixed className="size-4" />} onClick={locate}>
            Use my location
          </Button>
        </div>
      )}
      {state === "done" &&
        (nearby.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {nearby.map(({ event, km }) => (
              <EventCard key={event.id} event={event} category={byId.get(event.categoryId)} distanceKm={km} />
            ))}
          </div>
        ) : (
          <EmptyState title="No in-person events found" description="Try browsing all events instead." />
        ))}
    </div>
  );
}
