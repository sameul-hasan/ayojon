"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle, ExternalLink, Sparkles, Check, ShoppingBag } from "lucide-react";
import type { DatabaseState, EventRecord, PackageCode } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export interface EventTableProps {
  events: EventRecord[];
  db: DatabaseState;
  onSelectEventForPackage: (eventId: string) => void;
  onPublishFreeDraft: (eventId: string) => Promise<void>;
  onCreateNewClick: () => void;
}

export function EventTable({
  events,
  db,
  onSelectEventForPackage,
  onPublishFreeDraft,
  onCreateNewClick,
}: EventTableProps) {
  return (
    <Card className="shadow-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-line bg-surface">
        <div>
          <h2 className="text-base font-bold text-ink">Organization Events ({events.length})</h2>
          <p className="text-xs text-ink-muted">Manage your hosted events, publishing status, and monetization packages</p>
        </div>
        <Button
          size="sm"
          leftIcon={<PlusCircle className="size-3.5" />}
          onClick={onCreateNewClick}
        >
          Create New Event
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-line bg-canvas-alt text-[11px] uppercase tracking-wider font-semibold text-ink-muted">
            <tr>
              <th className="px-4 py-3">Event Title & Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Active Tier</th>
              <th className="px-4 py-3">Starts At</th>
              <th className="px-4 py-3">Capacity Sold</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  No events found for this organization. Create your first event!
                </td>
              </tr>
            ) : (
              events.map((evt) => {
                const tts = db.ticket_types.filter((t) => t.event_id === evt.id);
                const sold = tts.reduce((a, b) => a + b.sold_count, 0);

                return (
                  <tr key={evt.id} className="hover:bg-canvas-alt/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-ink">{evt.title}</div>
                      <div className="text-[11px] font-mono text-ink-muted">/{evt.slug}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        tone={
                          evt.status === "PUBLISHED"
                            ? "success"
                            : evt.status === "DRAFT"
                            ? "warning"
                            : "danger"
                        }
                        className="text-[10px]"
                      >
                        {evt.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      {evt.package_code ? (
                        <Badge tone="brand" className="font-mono text-[10px]">
                          {evt.package_code}
                        </Badge>
                      ) : (
                        <span className="text-ink-muted italic">Free Draft</span>
                      )}
                      {evt.is_featured && (
                        <Badge tone="coral" className="ml-1 text-[10px]">
                          Featured
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-ink-muted">
                      {new Date(evt.starts_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      {sold} / {evt.capacity}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {evt.status === "DRAFT" && (
                        <>
                          <Button
                            size="sm"
                            leftIcon={<ShoppingBag className="size-3" />}
                            onClick={() => onSelectEventForPackage(evt.id)}
                          >
                            Upgrade & Publish
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onPublishFreeDraft(evt.id)}
                          >
                            Publish Free
                          </Button>
                        </>
                      )}
                      {evt.status === "PUBLISHED" && (
                        <Link
                          href={`/events/${evt.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          <span>View Live</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

