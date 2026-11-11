"use client";

import React, { useState } from "react";
import {
  Send,
  MessageSquare,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { RFQMessage } from "@/lib/types";

interface RfqMessageThreadProps {
  rfqId: string;
  quotationId?: string;
  providerName: string;
  initialMessages?: RFQMessage[];
  currentRole: "ORGANIZER" | "PROVIDER";
}

const DEFAULT_SEED_MESSAGES: RFQMessage[] = [
  {
    id: "msg-1",
    rfq_id: "rfq-hackathon-2026",
    quotation_id: "qt-kib-001",
    sender_user_id: "usr-org-nusrat",
    sender_role: "ORGANIZER",
    message_text:
      "Assalamu Alaikum Kamal Bhai. Can we enter at 07:00 AM for stage backdrop setup instead of 08:00 AM?",
    read: true,
    created_at: "2026-11-07T10:15:00Z",
  },
  {
    id: "msg-2",
    rfq_id: "rfq-hackathon-2026",
    quotation_id: "qt-kib-001",
    sender_user_id: "usr-venue-kamal",
    sender_role: "PROVIDER",
    message_text:
      "Walaikum Assalam Nusrat Apa. Yes, 07:00 AM entry for production crew is approved without extra charge.",
    read: true,
    created_at: "2026-11-07T11:00:00Z",
  },
];

export function RfqMessageThread({
  rfqId,
  quotationId,
  providerName,
  initialMessages = DEFAULT_SEED_MESSAGES,
  currentRole = "ORGANIZER",
}: RfqMessageThreadProps) {
  const [messages, setMessages] = useState<RFQMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const newMsg: RFQMessage = {
      id: `msg-${Date.now()}`,
      rfq_id: rfqId,
      quotation_id: quotationId,
      sender_user_id: currentRole === "ORGANIZER" ? "usr-org-nusrat" : "usr-venue-kamal",
      sender_role: currentRole,
      message_text: text,
      read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText("");
  };

  return (
    <div className="flex flex-col h-[480px] rounded-card border border-line bg-surface overflow-hidden shadow-card">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-line bg-canvas-alt px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-xs">
            {providerName.charAt(0)}
          </div>
          <div>
            <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
              <span>{providerName}</span>
              <Badge tone="success" className="text-[10px] py-0">Verified Provider</Badge>
            </h4>
            <span className="text-[10px] text-ink-muted">RFQ Negotiation & Clarifications Thread</span>
          </div>
        </div>

        <Badge tone="neutral" className="text-[10px]">
          Acting as {currentRole === "ORGANIZER" ? "Organizer" : "Provider"}
        </Badge>
      </div>

      {/* QUICK CLARIFICATION TEMPLATES */}
      <div className="border-b border-line bg-canvas/60 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-[10px] font-semibold text-ink-muted shrink-0 mr-1 flex items-center gap-1">
          <Zap className="size-3 text-brand-600" /> Quick Prompts:
        </span>
        {[
          "Confirm standby generator fuel coverage",
          "Request 1-hour early loading access",
          "Can we apply academic non-profit concession?",
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="whitespace-nowrap rounded-full border border-line bg-surface px-2.5 py-0.5 text-[10px] text-ink-muted hover:border-brand-300 hover:text-brand-700 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isMe = m.sender_role === currentRole;
          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-[80%] ${
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div className="flex items-center gap-1 mb-1 text-[10px] text-ink-muted">
                <span className="font-semibold text-ink">
                  {m.sender_role === "ORGANIZER" ? "Organizer (Nusrat)" : providerName}
                </span>
                <span>&bull;</span>
                <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isMe
                    ? "bg-brand-600 text-white rounded-br-xs shadow-sm"
                    : "bg-canvas-alt border border-line text-ink rounded-bl-xs shadow-sm"
                }`}
              >
                {m.message_text}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER INPUT */}
      <div className="border-t border-line bg-surface p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type clarification message or price inquiry..."
            className="flex-1 rounded-btn border border-line bg-canvas-alt px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputText.trim()}
            className="h-8 px-3 gap-1"
          >
            <Send className="size-3" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
