"use client";

import React, { useState } from "react";
import Link from "@/components/ui/Link";
import { ArrowRight, CheckCircle2, CreditCard, Minus, Plus, ShieldCheck, Ticket } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { computeTotals, MAX_TICKETS_PER_ORDER, type PublicTicketType } from "@/lib/public-events-shared";
import { cn, formatBDT } from "@/lib/ui/cn";

/**
 * Ticket selection and price preview. Availability and prices come from the backend;
 * the backend re-validates inventory and recomputes totals at order time.
 */
export function BookingPanel({
  tickets,
  checkoutHref,
  ended,
}: {
  tickets: PublicTicketType[];
  checkoutHref: string;
  ended: boolean;
}) {
  const firstAvailable = tickets.find((t) => t.remaining > 0);
  const [ticketId, setTicketId] = useState(firstAvailable?.id ?? "");
  const [qty, setQty] = useState(1);

  const selected = tickets.find((t) => t.id === ticketId);
  const maxQty = selected ? Math.max(1, Math.min(MAX_TICKETS_PER_ORDER, selected.remaining)) : 1;
  const isFree = selected?.priceMinor === 0;
  // Free registration issues exactly one ticket per registration
  const safeQty = isFree ? 1 : Math.min(qty, maxQty);
  const totals = selected ? computeTotals(selected.priceMinor, safeQty) : null;

  const pick = (t: PublicTicketType) => {
    if (t.remaining <= 0) return;
    setTicketId(t.id);
    const limit = Math.max(1, Math.min(MAX_TICKETS_PER_ORDER, t.remaining));
    setQty((q) => Math.min(q, limit));
  };

  const href = selected
    ? `${checkoutHref}${checkoutHref.includes("?") ? "&" : "?"}ticket=${encodeURIComponent(selected.id)}&qty=${safeQty}`
    : checkoutHref;

  return (
    <Card id="booking" className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Ticket className="size-5 text-brand-600" aria-hidden /> Select Tickets
        </h2>
        {ended ? (
          <Badge tone="neutral">Event Ended</Badge>
        ) : selected?.priceMinor === 0 ? (
          <Badge tone="success">Free Entry</Badge>
        ) : (
          <Badge tone="brand">Official Ticketing</Badge>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="py-6 text-center">
          <Ticket className="mx-auto size-8 text-ink-muted/40" />
          <p className="mt-2 text-sm text-ink-muted">Tickets are not available for this event yet.</p>
        </div>
      ) : (
        <>
          <fieldset className="mt-4 space-y-2.5">
            <legend className="sr-only">Choose a ticket type</legend>
            {tickets.map((t) => {
              const soldOut = t.remaining <= 0;
              const active = t.id === ticketId;
              const isUrgent = !soldOut && t.remaining > 0 && t.remaining <= 10;

              return (
                <label
                  key={t.id}
                  className={cn(
                    "relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all duration-150",
                    active
                      ? "border-brand-600 bg-brand-50/70 shadow-sm ring-1 ring-brand-500/20"
                      : "border-line bg-surface hover:border-brand-300 hover:bg-canvas-alt",
                    soldOut && "cursor-not-allowed opacity-55 hover:border-line hover:bg-surface"
                  )}
                >
                  <input
                    type="radio"
                    name="ticket"
                    value={t.id}
                    checked={active}
                    disabled={soldOut}
                    onChange={() => pick(t)}
                    className="mt-1 size-4 accent-brand-600 focus:ring-brand-500"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{t.name}</span>
                      <span className="shrink-0 text-sm font-bold text-brand-700">
                        {t.priceMinor === 0 ? "Free" : formatBDT(t.priceMinor)}
                      </span>
                    </span>
                    {t.description && <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{t.description}</span>}
                    <span className="mt-2 flex items-center gap-2">
                      {soldOut ? (
                        <Badge tone="danger">Sold out</Badge>
                      ) : isUrgent ? (
                        <Badge tone="warning">Only {t.remaining} left</Badge>
                      ) : (
                        <span className="text-xs text-ink-muted">{t.remaining} available</span>
                      )}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          {selected && totals && !ended && (
            <>
              {!isFree && (
                <div className="mt-5 flex items-center justify-between rounded-xl bg-canvas-alt/70 p-3">
                  <div>
                    <span id="qty-label" className="text-sm font-semibold text-ink">
                      Quantity
                    </span>
                    <p className="text-xs text-ink-muted">Max {maxQty} per order</p>
                  </div>
                  <div className="flex items-center gap-1.5" role="group" aria-labelledby="qty-label">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={safeQty <= 1}
                      onClick={() => setQty(safeQty - 1)}
                      className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-ink transition hover:bg-canvas-alt disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="size-4" />
                    </button>
                    <output aria-live="polite" className="w-9 text-center text-sm font-bold text-ink">
                      {safeQty}
                    </output>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={safeQty >= maxQty}
                      onClick={() => setQty(safeQty + 1)}
                      className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-ink transition hover:bg-canvas-alt disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="mt-5 rounded-xl border border-line/80 bg-surface p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Order Breakdown</p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <div className="flex justify-between text-ink-muted">
                    <dt>
                      {selected.name} {safeQty > 1 && `(× ${safeQty})`}
                    </dt>
                    <dd className="font-medium text-ink">{isFree ? "৳ 0" : formatBDT(totals.subtotalMinor)}</dd>
                  </div>
                  {totals.feeMinor > 0 && (
                    <div className="flex justify-between text-ink-muted">
                      <dt>Platform Service Fee (2.5%)</dt>
                      <dd className="font-medium text-ink">{formatBDT(totals.feeMinor)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
                    <dt>Total Amount</dt>
                    <dd className="text-brand-700">{totals.totalMinor === 0 ? "Free" : formatBDT(totals.totalMinor)}</dd>
                  </div>
                </dl>
              </div>
            </>
          )}

          {ended ? (
            <div className="mt-4 rounded-xl bg-canvas-alt p-3.5 text-center text-sm font-medium text-ink-muted">
              This event has ended.
            </div>
          ) : selected ? (
            <Link
              href={href}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <span>{isFree ? "Register for Free" : "Continue to Checkout"}</span>
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <div className="mt-4 rounded-xl bg-red-50 p-3.5 text-center text-sm font-medium text-danger">
              All tickets for this event are sold out.
            </div>
          )}

          {/* Reassurance & Guarantee */}
          <div className="mt-4 space-y-2 border-t border-line/80 pt-4 text-xs text-ink-muted">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>Verified ticket pass with tamper-proof QR code issued instantly upon payment.</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
              <span>Supports bKash, Nagad, Rocket & credit/debit cards.</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
