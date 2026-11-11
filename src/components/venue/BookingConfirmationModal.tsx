"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  CreditCard,
  Phone,
  FileText,
  X,
  Printer,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatBDT } from "@/lib/public-events-shared";
import { useToast } from "@/components/ui/Toast";
import type { Quotation, VenueRequest, VenueBooking } from "@/lib/types";

interface BookingConfirmationModalProps {
  rfq: VenueRequest | null;
  quotation: Quotation | null;
  open: boolean;
  onClose: () => void;
  onBookingConfirmed: (booking: VenueBooking) => void;
}

export function BookingConfirmationModal({
  rfq,
  quotation,
  open,
  onClose,
  onBookingConfirmed,
}: BookingConfirmationModalProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"BKASH" | "NAGAD" | "SSLCOMMERZ" | "OFFICIAL_MOU">("BKASH");
  const [accountNumber, setAccountNumber] = useState("01711223344");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<VenueBooking | null>(null);

  if (!open || !quotation || !rfq) return null;

  const depositPercentage = quotation.payment_terms.deposit_percentage || 50;
  const depositAmountBDT = Math.round((quotation.grand_total_bdt * depositPercentage) / 100);

  const handleConfirm = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const newBooking: VenueBooking = {
        id: `vb-${Date.now().toString(36)}`,
        rfq_id: rfq.id,
        accepted_quotation_id: quotation.id,
        organizer_user_id: rfq.organizer_user_id,
        provider_user_id: quotation.provider_user_id,
        venue_id: quotation.venue_id,
        service_id: quotation.service_id,
        event_date: rfq.event_date,
        total_agreed_bdt: quotation.grand_total_bdt,
        deposit_required_bdt: depositAmountBDT,
        deposit_paid_bdt: depositAmountBDT,
        status: "CONFIRMED",
        payment_reference_id: `MFS-DEP-${Math.floor(100000 + Math.random() * 900000)}`,
        notes: `Accepted quotation rev #${quotation.revision_number}. Payment via ${paymentMethod}.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to localStorage for demo persistence
      try {
        const stored = localStorage.getItem("aayojon_custom_bookings");
        const list: VenueBooking[] = stored ? JSON.parse(stored) : [];
        list.unshift(newBooking);
        localStorage.setItem("aayojon_custom_bookings", JSON.stringify(list));
      } catch (e) {
        // ignore
      }

      setConfirmedBooking(newBooking);
      setIsProcessing(false);
      onBookingConfirmed(newBooking);

      toast({
        title: "Booking Confirmed & Date Locked!",
        description: `Venue reserved for ${rfq.event_date}. Booking voucher generated.`,
        tone: "success",
      });
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-card border border-line bg-surface p-6 shadow-pop text-ink">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-btn p-1.5 text-ink-muted hover:bg-canvas-alt hover:text-ink transition"
        >
          <X className="size-5" />
        </button>

        {confirmedBooking ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-success border border-emerald-200">
              <CheckCircle2 className="size-8" />
            </div>

            <div>
              <Badge tone="success">Space Reserved & Confirmed</Badge>
              <h3 className="mt-2 text-xl font-bold text-ink">Official Booking Voucher</h3>
              <p className="text-xs text-ink-muted font-mono mt-0.5">Voucher Reference: {confirmedBooking.id}</p>
            </div>

            <div className="rounded-card border border-line bg-canvas-alt p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-ink-muted">Event:</span>
                <span className="font-bold text-ink">{rfq.event_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Reserved Date:</span>
                <span className="font-semibold text-ink">{confirmedBooking.event_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Provider:</span>
                <span className="font-semibold text-brand-700">{quotation.provider_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Agreed Package:</span>
                <span className="font-bold text-ink">{formatBDT(confirmedBooking.total_agreed_bdt)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <span className="text-ink-muted">Deposit Paid:</span>
                <span className="font-bold text-emerald-700">{formatBDT(confirmedBooking.deposit_paid_bdt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">MFS / Bank Ref:</span>
                <span className="font-mono text-ink">{confirmedBooking.payment_reference_id}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => window.print()}
              >
                <Printer className="size-3.5" /> Print Agreement
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onClose}
              >
                Back to Workspace
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200 mb-1">
                <Building2 className="size-3" />
                <span>Confirm Booking & Lock Date</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Accept Quotation from {quotation.provider_name}
              </h2>
            </div>

            {/* AGREEMENT SUMMARY */}
            <div className="rounded-card border border-brand-200 bg-brand-50/40 p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-muted">Target Event:</span>
                <span className="font-semibold text-ink">{rfq.event_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Reserved Date:</span>
                <span className="font-semibold text-ink">{rfq.event_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Agreed Grand Total:</span>
                <span className="font-bold text-brand-700">{formatBDT(quotation.grand_total_bdt)}</span>
              </div>
              <div className="flex justify-between border-t border-brand-200 pt-2 font-bold text-ink">
                <span>Required Reservation Deposit ({depositPercentage}%):</span>
                <span className="text-brand-700 text-sm">{formatBDT(depositAmountBDT)}</span>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTION */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-2">
                Select Deposit Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: "BKASH", label: "bKash MFS", sub: "Instant Checkout" },
                  { id: "NAGAD", label: "Nagad", sub: "Direct Payment" },
                  { id: "SSLCOMMERZ", label: "Cards / Internet Bank", sub: "Visa / Mastercard" },
                  { id: "OFFICIAL_MOU", label: "Invoice / MoU", sub: "Within 48h" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id as any)}
                    className={`p-3 rounded-btn border text-left transition ${
                      paymentMethod === opt.id
                        ? "border-brand-600 bg-brand-50 text-brand-800 font-semibold ring-1 ring-brand-300"
                        : "border-line bg-canvas-alt text-ink-muted hover:bg-canvas"
                    }`}
                  >
                    <span className="block font-bold">{opt.label}</span>
                    <span className="block text-[10px] text-ink-muted">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "BKASH" && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  bKash Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-btn border border-line bg-canvas-alt px-3 py-2 text-xs text-ink font-mono"
                />
                <span className="mt-1 block text-[10px] text-ink-muted">
                  Test Sandbox: Demo payment verification will automatically succeed.
                </span>
              </div>
            )}

            <div className="rounded-btn border border-line bg-canvas-alt p-3 text-xs text-ink-muted flex items-start gap-2">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Funds are held in secure escrow. The venue calendar is reserved immediately upon confirmation.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="gap-1.5"
              >
                {isProcessing ? "Confirming..." : `Pay Deposit ${formatBDT(depositAmountBDT)} & Confirm`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

