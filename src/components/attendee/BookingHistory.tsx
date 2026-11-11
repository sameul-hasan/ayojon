"use client";

import React from "react";
import Link from "next/link";
import { Clock, RefreshCw, AlertCircle } from "lucide-react";
import type { DatabaseState, Order } from "@/lib/types";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatBDT } from "@/lib/ui/cn";

function orderTone(status: Order["status"]): BadgeTone {
  switch (status) {
    case "PAID":
      return "success";
    case "PENDING":
      return "warning";
    case "FAILED":
    case "CANCELLED":
      return "danger";
    case "REFUNDED":
      return "info";
  }
}

export function BookingHistory({
  orders,
  db,
  onVerifyPendingOrder,
}: {
  orders: Order[];
  db: DatabaseState;
  onVerifyPendingOrder?: (orderId: string) => Promise<void>;
}) {
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);

  const handleVerify = async (orderId: string) => {
    if (!onVerifyPendingOrder) return;
    setVerifyingId(orderId);
    try {
      await onVerifyPendingOrder(orderId);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {orders.map((ord) => {
        const event = db.events.find((e) => e.id === ord.event_id);
        const items = db.order_items.filter((i) => i.order_id === ord.id);
        const payment = db.payments.find((p) => p.order_id === ord.id);

        return (
          <Card key={ord.id} className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={orderTone(ord.status)}>{ord.status}</Badge>
                  <span className="font-mono text-xs text-ink-muted">#{ord.id}</span>
                  <span className="text-xs text-ink-muted">
                    {new Date(ord.created_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Dhaka",
                    })}
                  </span>
                </div>

                <h4 className="text-base font-bold">
                  {event ? (
                    <Link href={`/events/${event.slug}`} className="hover:text-brand-600">
                      {event.title}
                    </Link>
                  ) : (
                    ord.order_type
                  )}
                </h4>

                <p className="text-xs text-ink-muted">
                  Buyer: <span className="text-ink font-medium">{ord.attendee_name}</span> ({ord.attendee_email})
                  {ord.attendee_phone && ` · ${ord.attendee_phone}`}
                </p>

                {items.length > 0 && (
                  <ul className="pt-1 text-xs text-ink-muted space-y-0.5">
                    {items.map((it) => (
                      <li key={it.id}>
                        {it.quantity} × {it.description} — {formatBDT(it.line_total_minor)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex shrink-0 flex-row sm:flex-col items-end justify-between sm:justify-start gap-2 border-t border-line pt-3 sm:border-t-0 sm:pt-0">
                <div className="text-right">
                  <p className="text-xs text-ink-muted">Total</p>
                  <p className="text-lg font-bold text-ink">{formatBDT(ord.total_minor)}</p>
                </div>

                {ord.status === "PENDING" && onVerifyPendingOrder && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={verifyingId === ord.id}
                    leftIcon={<RefreshCw className="size-3.5" />}
                    onClick={() => handleVerify(ord.id)}
                  >
                    Simulate webhook
                  </Button>
                )}

                {payment && (
                  <span className="text-[11px] text-ink-muted font-mono">
                    {payment.provider.replace("_SANDBOX", "")}
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

