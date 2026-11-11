"use client";

import React, { useState } from "react";
import { Calendar, Check, Copy, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

function toGCalIso(iso: string): string {
  try {
    return new Date(iso).toISOString().replace(/-|:|\.\d\d\d/g, "");
  } catch {
    return "";
  }
}

export function TicketPrintActions({
  ticketId,
  eventTitle,
  startsAt,
  endsAt,
  location,
}: {
  ticketId: string;
  eventTitle: string;
  startsAt: string;
  endsAt: string;
  location: string;
}) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyLink = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // fallback
    }
  };

  const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    eventTitle
  )}&dates=${toGCalIso(startsAt)}/${toGCalIso(endsAt)}&location=${encodeURIComponent(location)}`;

  return (
    <div className="flex flex-wrap items-center gap-2.5 print:hidden">
      <Button
        variant="primary"
        onClick={handlePrint}
        leftIcon={<Printer className="size-4" />}
        className="shadow-sm"
      >
        Print / Save PDF
      </Button>

      <a
        href={gCalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-btn border border-line bg-surface px-4 text-xs font-semibold text-ink shadow-sm transition hover:border-brand-300 hover:text-brand-700"
      >
        <Calendar className="size-4 text-brand-600" />
        Add to Calendar
      </a>

      <Button
        variant="outline"
        onClick={handleCopyLink}
        leftIcon={copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      >
        {copied ? "Pass Link Copied" : "Copy Pass Link"}
      </Button>
    </div>
  );
}

