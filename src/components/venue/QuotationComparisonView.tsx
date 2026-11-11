"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Sparkles,
  DollarSign,
  Users,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Layers,
  FileText,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatBDT } from "@/lib/public-events-shared";
import type { Quotation, VenueRequest } from "@/lib/types";
import { RfqMessageThread } from "@/components/venue/RfqMessageThread";

interface QuotationComparisonViewProps {
  rfq: VenueRequest;
  quotations: Quotation[];
  onAcceptQuotation: (quote: Quotation) => void;
  onBack?: () => void;
}

export function QuotationComparisonView({
  rfq,
  quotations,
  onAcceptQuotation,
  onBack,
}: QuotationComparisonViewProps) {
  const [activeChatQuote, setActiveChatQuote] = useState<Quotation | null>(null);

  // Find lowest price
  const lowestPrice = Math.min(...quotations.map((q) => q.grand_total_bdt));

  return (
    <div className="space-y-6">
      {/* HEADER & RFQ CONTEXT */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack} className="text-xs h-7">
                &larr; Back to RFQs
              </Button>
            )}
            <Badge tone="brand">RFQ #{rfq.id}</Badge>
            <span className="text-xs text-ink-muted">Comparing {quotations.length} Received Quotations</span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {rfq.event_title}
          </h2>
          <p className="text-xs text-ink-muted">
            Target Date: <strong className="text-ink">{rfq.event_date}</strong> &bull; Audience:{" "}
            <strong className="text-ink">{rfq.expected_guests} Attendees</strong> &bull; Target Budget:{" "}
            <strong className="text-brand-700">{formatBDT(rfq.budget.total_budget_bdt)}</strong>
          </p>
        </div>
      </div>

      {/* AI COMPARATIVE INSIGHT BANNER */}
      <div className="rounded-card border border-brand-200 bg-gradient-to-r from-brand-50 via-canvas-alt to-brand-50 p-4 shadow-sm text-ink">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sparkles className="size-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
              <span>AI Comparative Trade-Off Analysis</span>
              <span className="rounded-full bg-violet/20 px-2 py-0.2 text-[10px] text-brand-700 font-semibold">
                Dhaka Market Benchmark
              </span>
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              We identified <strong>2 formal bids</strong>. The venue proposal from{" "}
              <strong>Krishibid Institution Bangladesh (KIB)</strong> fulfills your capacity of 400 with 1,200 seats, includes a continuous 200kVA generator power backup, and applies a ৳5,000 academic institutional discount. The service quotation from <strong>SoundCraft BD</strong> handles the 36-hour late-night audio coverage. Total combined package is within your ৳150,000 budget envelope.
            </p>
          </div>
        </div>
      </div>

      {/* SIDE-BY-SIDE QUOTATIONS GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        {quotations.map((quote) => {
          const isLowest = quote.grand_total_bdt === lowestPrice;
          const costPerGuest = Math.round(quote.grand_total_bdt / rfq.expected_guests);

          return (
            <Card
              key={quote.id}
              className={`flex flex-col border p-6 transition-all ${
                isLowest
                  ? "border-brand-500 shadow-pop bg-surface ring-1 ring-brand-300"
                  : "border-line bg-surface shadow-card"
              }`}
            >
              {/* Card Top */}
              <div className="flex items-start justify-between border-b border-line pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={quote.provider_type === "VENUE_OWNER" ? "brand" : "neutral"}>
                      {quote.provider_type === "VENUE_OWNER" ? "Venue Proposal" : "Vendor Service"}
                    </Badge>
                    {isLowest && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <TrendingDown className="size-3" /> Best Price
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-ink">{quote.provider_name}</h3>
                  <span className="text-[11px] text-ink-muted">
                    Revision #{quote.revision_number} &bull; Valid until: {new Date(quote.valid_until).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-extrabold text-brand-700">
                    {formatBDT(quote.grand_total_bdt)}
                  </span>
                  <span className="block text-[11px] text-ink-muted">
                    ~৳{costPerGuest.toLocaleString()} / attendee
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-4 border-b border-line space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1">
                  <Layers className="size-3 text-brand-600" /> Itemized Line Items
                </span>
                <div className="rounded-btn border border-line bg-canvas-alt overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-canvas border-b border-line text-[10px] font-bold text-ink-muted uppercase">
                      <tr>
                        <th className="px-3 py-1.5">Description</th>
                        <th className="px-3 py-1.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {quote.line_items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-1.5 text-ink">
                            <span className="font-medium">{item.description}</span>
                            {item.quantity > 1 && (
                              <span className="ml-1 text-[10px] text-ink-muted">x{item.quantity}</span>
                            )}
                          </td>
                          <td
                            className={`px-3 py-1.5 text-right font-semibold ${
                              item.total_bdt < 0 ? "text-emerald-600" : "text-ink"
                            }`}
                          >
                            {formatBDT(item.total_bdt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between text-xs pt-1 px-1">
                  <span className="text-ink-muted">Subtotal: {formatBDT(quote.subtotal_bdt)}</span>
                  {quote.discount_bdt > 0 && (
                    <span className="font-semibold text-emerald-600">
                      Discount: -{formatBDT(quote.discount_bdt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="py-4 border-b border-line space-y-3 flex-1 text-xs">
                <div>
                  <span className="font-semibold text-ink flex items-center gap-1 mb-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" /> Key Inclusions:
                  </span>
                  <ul className="space-y-1 pl-4">
                    {quote.inclusions.map((inc, i) => (
                      <li key={i} className="list-disc text-ink-muted">
                        {inc}
                      </li>
                    ))}
                  </ul>
                </div>

                {quote.exclusions.length > 0 && (
                  <div>
                    <span className="font-semibold text-ink flex items-center gap-1 mb-1.5 text-amber-800">
                      <XCircle className="size-3.5 text-amber-600" /> Exclusions / Notes:
                    </span>
                    <ul className="space-y-1 pl-4">
                      {quote.exclusions.map((exc, i) => (
                        <li key={i} className="list-disc text-ink-muted">
                          {exc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Payment Terms */}
              <div className="py-3 border-b border-line text-xs bg-canvas-alt/50 -mx-6 px-6">
                <div className="flex justify-between items-center">
                  <span className="text-ink-muted">Required Deposit:</span>
                  <span className="font-bold text-ink">
                    {quote.payment_terms.deposit_percentage}% (
                    {formatBDT(
                      Math.round(
                        (quote.grand_total_bdt * quote.payment_terms.deposit_percentage) / 100
                      )
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1 text-[11px] text-ink-muted">
                  <span>Balance Due:</span>
                  <span>{quote.payment_terms.final_payment_due.replace("_", " ")}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveChatQuote(quote)}
                  className="gap-1 text-xs"
                >
                  <MessageSquare className="size-3.5" /> Chat
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAcceptQuotation(quote)}
                  className="flex-1 gap-1.5 text-xs"
                >
                  <span>Accept Proposal</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* IN-CONTEXT CHAT MODAL */}
      {activeChatQuote && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-lg">
            <button
              onClick={() => setActiveChatQuote(null)}
              className="absolute -top-3 -right-3 z-10 size-8 rounded-full bg-surface border border-line flex items-center justify-center text-ink-muted hover:text-ink shadow-md"
            >
              &times;
            </button>
            <RfqMessageThread
              rfqId={rfq.id}
              quotationId={activeChatQuote.id}
              providerName={activeChatQuote.provider_name}
              currentRole="ORGANIZER"
            />
          </div>
        </div>
      )}
    </div>
  );
}

