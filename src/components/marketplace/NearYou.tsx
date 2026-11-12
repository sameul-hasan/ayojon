"use client";

import React, { useState } from "react";
import { LocateFixed, MapPin, Navigation, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
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

interface AreaHub {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
}

const POPULAR_HUBS: AreaHub[] = [
  { id: "hub-farmgate", name: "Central Dhaka", area: "Farmgate / Tejgaon", lat: 23.7588, lng: 90.3842 },
  { id: "hub-gulshan", name: "Gulshan & Banani", area: "Diplomatic Zone", lat: 23.7925, lng: 90.4152 },
  { id: "hub-palashi", name: "Palashi / BUET", area: "Old Dhaka & Campuses", lat: 23.726, lng: 90.3885 },
  { id: "hub-bashundhara", name: "Bashundhara R/A", area: "NSU & IUB Zone", lat: 23.8151, lng: 90.4255 },
  { id: "hub-chattogram", name: "Chattogram Hub", area: "Agrabad & CUET", lat: 22.4633, lng: 91.9714 },
  { id: "hub-sylhet", name: "Sylhet Hub", area: "Rikabi Bazar & SUST", lat: 24.899, lng: 91.861 },
];

/** Location is requested only after the user clicks, and is never sent to a server. */
export function NearYou({ events, categories }: { events: PublicEvent[]; categories: PublicCategory[] }) {
  const [state, setState] = useState<State>("idle");
  const [activeLocationLabel, setActiveLocationLabel] = useState<string>("");
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [nearby, setNearby] = useState<Array<{ event: PublicEvent; km: number }>>([]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  const hasGeo = events.some((e) => e.lat !== null && e.lng !== null);

  if (!hasGeo) return null;

  const calculateProximity = (userLat: number, userLng: number, label: string, hubId: string | null = null) => {
    const list = events
      .filter((e) => e.lat !== null && e.lng !== null)
      .map((e) => ({ event: e, km: haversineKm(userLat, userLng, e.lat!, e.lng!) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 4);

    setNearby(list);
    setActiveLocationLabel(label);
    setSelectedHubId(hubId);
    setState("done");
  };

  const locate = () => {
    if (!("geolocation" in navigator)) return setState("unsupported");
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        calculateProximity(pos.coords.latitude, pos.coords.longitude, "Your Current GPS Location", null);
      },
      () => setState("denied"),
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  const selectHub = (hub: AreaHub) => {
    calculateProximity(hub.lat, hub.lng, `${hub.name} (${hub.area})`, hub.id);
  };

  const resetLocation = () => {
    setState("idle");
    setActiveLocationLabel("");
    setSelectedHubId(null);
    setNearby([]);
  };

  return (
    <section id="near-you" className="space-y-6 pt-4">
      {/* Top Banner / Discovery Card */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-200/90 bg-gradient-to-br from-brand-50/60 via-surface to-emerald-50/40 p-6 sm:p-8 shadow-card transition-all">
        {/* Subtle decorative glow */}
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand-400/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-brand-600" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                In-Person Proximity Radar
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-medium text-ink-muted border border-line">
                <ShieldCheck className="size-3 text-emerald-600" />
                <span>On-device only</span>
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
              Events Happening Near You
            </h2>

            <p className="text-sm text-ink-muted leading-relaxed" role="status">
              {state === "denied"
                ? "Location permission was denied. Tap any neighborhood hub below to instantly calculate closest gatherings:"
                : state === "unsupported"
                  ? "Your browser does not support geolocation. Pick any neighborhood hub below:"
                  : "Share your location to see the closest in-person events. It stays on your device."}
            </p>

            {/* Quick Area Hub Selector Pills */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted mb-2">
                <MapPin className="size-3.5 text-brand-600" />
                <span>Quick Area Hubs:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {POPULAR_HUBS.map((hub) => {
                  const isSelected = selectedHubId === hub.id;
                  return (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => selectHub(hub)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-brand-600 text-white shadow-xs font-semibold ring-2 ring-brand-300"
                          : "border border-brand-200/80 bg-surface/90 text-ink hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900"
                      }`}
                    >
                      <span>{hub.name}</span>
                      <span className={`text-[10px] ${isSelected ? "text-brand-100" : "text-ink-muted"}`}>
                        · {hub.area.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Button & Active Status */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
            <Button
              variant={state === "done" && !selectedHubId ? "primary" : "secondary"}
              loading={state === "locating"}
              leftIcon={<LocateFixed className="size-4" />}
              onClick={locate}
              className="w-full sm:w-auto shadow-xs"
            >
              Use my location
            </Button>

            {state === "done" && (
              <button
                type="button"
                onClick={resetLocation}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-brand-700 transition-colors"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset Location</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Proximity Bar when Done */}
        {state === "done" && (
          <div className="mt-6 pt-4 border-t border-brand-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-ink font-semibold">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Navigation className="size-3" />
              </span>
              <span>
                Showing gatherings closest to <span className="text-brand-700 font-bold">{activeLocationLabel}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-ink-muted">
              <span className="inline-flex size-2 rounded-full bg-emerald-500" />
              <span>{nearby.length} verified events ranked by distance</span>
            </div>
          </div>
        )}
      </div>

      {/* Events Result Grid */}
      {state === "done" &&
        (nearby.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {nearby.map(({ event, km }) => (
              <EventCard key={event.id} event={event} category={byId.get(event.categoryId)} distanceKm={km} />
            ))}
          </div>
        ) : (
          <EmptyState title="No in-person events found" description="Try selecting another neighborhood hub above." />
        ))}
    </section>
  );
}
