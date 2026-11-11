"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "@/components/ui/Link";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Calculator,
  Building2,
  CheckCircle2,
  FileText,
  DollarSign,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  HelpCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PARTNER_VENUES } from "@/lib/venues-catalog";
import { formatBDT } from "@/lib/public-events-shared";
import type { VenueRequest } from "@/lib/types";

export interface AIMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  structuredRfq?: Partial<VenueRequest>;
  budgetBreakdown?: {
    venue: number;
    soundLighting: number;
    catering: number;
    stageFabrication: number;
    contingency: number;
    total: number;
  };
  timestamp: string;
}

const PRESET_PROMPTS = [
  {
    label: "400-Person Tech Hackathon in Dhaka",
    query:
      "I am organizing a 400-person tech hackathon in Dhaka for 36 hours. What venue would suit us, what is the realistic budget breakdown, and what technical amenities do we need?",
  },
  {
    label: "Startup Demo Day & Investor Pitch",
    query:
      "I need a venue in Gulshan or Banani for an executive startup demo day with 150 guests, high-speed fiber internet, and buffet catering. Recommend options and estimate cost.",
  },
  {
    label: "Explain Sound & Generator Line Items",
    query:
      "How do sound system packages and generator diesel charges usually work for Dhaka auditoriums? Help me understand the typical exclusions.",
  },
  {
    label: "Vendor Negotiation Script",
    query:
      "Draft a polite, professional negotiation message to request a 10% educational institution discount on an auditorium rental in Farmgate.",
  },
];

const INITIAL_MESSAGES: AIMessage[] = [
  {
    id: "msg-welcome",
    sender: "ai",
    text: `Hello! I am your **Aayojon AI Event Planning Assistant**.\n\nI can help you navigate venue requirements, calculate realistic budget allocations across Bangladesh, recommend verified spaces, explain vendor line items, and generate a structured RFQ draft that you can broadcast directly to venue owners and service vendors.\n\nHow can I help you plan your next event today?`,
    timestamp: "Just now",
  },
];

interface AIAssistantWidgetProps {
  onTransferToRfq?: (rfq: Partial<VenueRequest>) => void;
  standalone?: boolean;
}

export function AIAssistantWidget({ onTransferToRfq, standalone = false }: AIAssistantWidgetProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AIMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let responseText = "";
      let structuredRfq: Partial<VenueRequest> | undefined = undefined;
      let budgetBreakdown: AIMessage["budgetBreakdown"] | undefined = undefined;

      if (lower.includes("hackathon") || lower.includes("400")) {
        responseText = `### Strategic Plan: 400-Person Tech Hackathon\n\nFor a collegiate or developer hackathon with 400 innovators in Dhaka:\n\n1. **Recommended Venue:** **Krishibid Institution Bangladesh (KIB) Auditorium** (Farmgate) or **BUET ECE Auditorium** (Palashi). Both offer high power endurance, 200kVA generator backup, and high-speed bandwidth.\n2. **Acoustic & Tech:** An auditorium with dual greenrooms enables team rest zones and dedicated sponsor stalls in the lobby.\n3. **Dhaka Transit Note:** Farmgate offers central bus/metro connectivity for students travelling from NSU, BRAC, BUET, and DU.`;

        budgetBreakdown = {
          venue: 85000,
          soundLighting: 28000,
          catering: 55000,
          stageFabrication: 20000,
          contingency: 12000,
          total: 200000,
        };

        structuredRfq = {
          event_title: "Dhaka Tech Hackathon 2027",
          event_type: "Collegiate Hackathon & Expo",
          description: "36-hour collegiate developer hackathon with opening ceremony, keynote stages, and awards showcase.",
          expected_guests: 400,
          location_requirements: {
            city: "Dhaka",
            preferred_areas: ["Farmgate", "Palashi", "Gulshan"],
            venue_category: "AUDITORIUM",
            indoor_outdoor: "INDOOR",
            required_facilities: ["AC", "PARKING", "GENERATOR", "WIFI"],
          },
          budget: {
            total_budget_bdt: 200000,
            venue_only_budget_bdt: 85000,
            services_budget_bdt: 75000,
            flexible: true,
          },
        };
      } else if (lower.includes("startup") || lower.includes("demo day") || lower.includes("150")) {
        responseText = `### Recommendation: Executive Startup Demo Day (150 Guests)\n\nFor an investor pitch in Dhaka's tech corridor:\n\n1. **Top Match:** **EMK Center Innovation Hub** (Gulshan-2). It has modular seating, interactive smart boards, 1080p livestream rigs, and high-speed optical fiber.\n2. **Daily Rate:** ৳28,000 standard daily rate.\n3. **Catering Strategy:** Evening high-tea and canapes (mini burgers, chicken skewers, baklava, and premium coffee) runs roughly ৳350-৳500 per guest.`;

        budgetBreakdown = {
          venue: 28000,
          soundLighting: 15000,
          catering: 45000,
          stageFabrication: 12000,
          contingency: 10000,
          total: 110000,
        };

        structuredRfq = {
          event_title: "Aayojon Seed Pitch & Demo Showcase",
          event_type: "Startup Investor Demo Day",
          description: "Curated investor demo day for 150 tech founders, angels, and VC representatives.",
          expected_guests: 150,
          location_requirements: {
            city: "Dhaka",
            preferred_areas: ["Gulshan", "Banani"],
            venue_category: "INNOVATION_HUB",
            indoor_outdoor: "INDOOR",
            required_facilities: ["AC", "WIFI", "PROJECTOR"],
          },
          budget: {
            total_budget_bdt: 110000,
            venue_only_budget_bdt: 28000,
            services_budget_bdt: 50000,
            flexible: true,
          },
        };
      } else if (lower.includes("negotiation") || lower.includes("discount") || lower.includes("script")) {
        responseText = `### Professional Educational / Non-Profit Negotiation Draft\n\nHere is a courteous, high-conversion negotiation message you can send directly in the RFQ clarification chat:\n\n> *"Assalamu Alaikum,\n>\n> Thank you for sharing the detailed quotation for your auditorium space. We deeply appreciate the professionalism and comprehensive facilities included in your proposal.\n>\n> Our upcoming summit is a non-profit academic initiative hosted by university students and faculty researchers. We have a disciplined institutional budget cap. Would it be possible to consider an educational partnership concession of 10% on the base hall rental (or alternatively waive the late-night technical overtime charge)?\n>\n> In return, we would be delighted to prominently feature your venue on our official event passes, stage backdrops, and Aayojon digital event program as our Official Venue Partner.\n>\n> Looking forward to your kind consideration.\n>\n> Warm regards,\n> Event Organizing Committee"*\n\nThis framework highlights mutual value without sounding aggressive.`;
      } else if (lower.includes("sound") || lower.includes("generator") || lower.includes("line item") || lower.includes("exclusion")) {
        responseText = `### Breakdown: Sound Systems & Generator Charges in Bangladesh\n\nWhen reviewing quotations from Dhaka venue owners and AV vendors, be mindful of these subtle line items:\n\n1. **Generator Standby vs. Fuel Consumption:**\n   - Most auditoriums provide the generator unit for free, but some bill diesel fuel separately if public power outage exceeds 2 continuous hours. Always confirm: *"Is fuel included in the base rate?"*\n2. **PA System vs. Line-Array Sound:**\n   - Standard speech PA (podium mics + 2 speakers) is sufficient for lectures.\n   - Live musical performances or high-energy conferences require a **dual line-array rig with subwoofers and sound engineers** (typically ৳25,000 - ৳50,000 extra).\n3. **Hall Curfew:**\n   - Standard booking slots are 8:00 AM to 10:00 PM. Overtime past 11:00 PM frequently incurs a ৳3,000 - ৳5,000 per hour staff surcharge.`;
      } else {
        responseText = `Thank you for sharing your requirements! Based on your prompt, here are key planning guidelines for organizing events in Bangladesh:\n\n- **Seasonality & Traffic:** Always budget a 45-minute buffer for Dhaka traffic during weekdays, especially for venues in Farmgate, Tejgaon, or Mohakhali.\n- **Standby Generator:** Essential across all seasons. Ensure the contract includes uninterrupted 200kVA auto-switchover.\n- **Prayer Space:** Ensure the venue reserves dedicated prayer rooms for men and women.\n- **Payment Invariant:** Standard booking deposits in Bangladesh range between 30% and 50%, with the balance settled before gate opening.\n\nWould you like me to generate a tailored budget breakdown or pre-fill a formal RFQ for this?`;
      }

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: responseText,
        structuredRfq,
        budgetBreakdown,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 850);
  };

  const handleApplyRfq = (rfqData?: Partial<VenueRequest>) => {
    if (!rfqData) return;
    if (onTransferToRfq) {
      onTransferToRfq(rfqData);
    } else {
      // Store in session storage and navigate to organizer portal
      try {
        sessionStorage.setItem("aayojon_ai_prefilled_rfq", JSON.stringify(rfqData));
      } catch (e) {
        // ignore
      }
      navigate("/organizer?rfq=new");
    }
  };

  return (
    <div className={`flex flex-col ${standalone ? "h-[750px]" : "h-full"} bg-surface rounded-card border border-line shadow-card overflow-hidden`}>
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-line bg-canvas-alt px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <span>Aayojon AI Planning Assistant</span>
              <span className="rounded-full bg-violet/20 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                Bangladesh Market
              </span>
            </h2>
            <p className="text-[11px] text-ink-muted">Venue discovery, budget breakdowns, and instant RFQ synthesis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessages(INITIAL_MESSAGES)}
            className="text-xs h-7 gap-1"
          >
            <RefreshCw className="size-3" /> Reset Chat
          </Button>
        </div>
      </div>

      {/* QUICK PRESET CHIPS */}
      <div className="border-b border-line bg-canvas/60 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[11px] font-semibold text-ink-muted shrink-0 mr-1 flex items-center gap-1">
          <Zap className="size-3 text-brand-600" /> Quick Prompts:
        </span>
        {PRESET_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.query)}
            className="whitespace-nowrap rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-muted hover:border-brand-300 hover:text-brand-700 hover:bg-canvas-alt transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* CHAT MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                msg.sender === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-canvas-alt border border-line text-brand-700"
              }`}
            >
              {msg.sender === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>

            <div className="space-y-3">
              <div
                className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-canvas-alt border border-line text-ink shadow-sm"
                }`}
              >
                <div className="whitespace-pre-line prose-sm prose-p:my-1 prose-headings:font-bold prose-headings:text-ink">
                  {msg.text}
                </div>
                <div
                  className={`mt-1.5 text-[10px] text-right ${
                    msg.sender === "user" ? "text-brand-200" : "text-ink-muted"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* BUDGET BREAKDOWN CARD IF ATTACHED */}
              {msg.budgetBreakdown && (
                <div className="rounded-card border border-brand-200 bg-brand-50/50 p-4 text-ink shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-brand-200 pb-2">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-brand-900">
                      <Calculator className="size-3.5 text-brand-600" /> Recommended Budget Breakdown (Dhaka)
                    </span>
                    <span className="font-extrabold text-sm text-brand-700">
                      {formatBDT(msg.budgetBreakdown.total)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between bg-surface p-2 rounded-btn border border-line">
                      <span className="text-ink-muted">Auditorium / Hall:</span>
                      <span className="font-semibold">{formatBDT(msg.budgetBreakdown.venue)}</span>
                    </div>
                    <div className="flex justify-between bg-surface p-2 rounded-btn border border-line">
                      <span className="text-ink-muted">Sound & Lighting:</span>
                      <span className="font-semibold">{formatBDT(msg.budgetBreakdown.soundLighting)}</span>
                    </div>
                    <div className="flex justify-between bg-surface p-2 rounded-btn border border-line">
                      <span className="text-ink-muted">Catering & Meals:</span>
                      <span className="font-semibold">{formatBDT(msg.budgetBreakdown.catering)}</span>
                    </div>
                    <div className="flex justify-between bg-surface p-2 rounded-btn border border-line">
                      <span className="text-ink-muted">Stage Fabrication:</span>
                      <span className="font-semibold">{formatBDT(msg.budgetBreakdown.stageFabrication)}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-ink-muted flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    <span>Includes ৳{msg.budgetBreakdown.contingency.toLocaleString()} reserved for generator diesel & logistical buffer.</span>
                  </div>
                </div>
              )}

              {/* STRUCTURED RFQ CARD IF ATTACHED */}
              {msg.structuredRfq && (
                <div className="rounded-card border-2 border-brand-400 bg-surface p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge tone="brand">Synthesized RFQ Draft</Badge>
                    <span className="text-[11px] text-ink-muted">Ready to broadcast</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-ink">{msg.structuredRfq.event_title}</h3>
                    <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{msg.structuredRfq.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-canvas-alt rounded-btn border border-line">
                    <div>
                      <span className="block text-[10px] text-ink-muted">Guests</span>
                      <span className="font-bold text-ink">{msg.structuredRfq.expected_guests}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-muted">City</span>
                      <span className="font-bold text-ink">{msg.structuredRfq.location_requirements?.city}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-muted">Target Budget</span>
                      <span className="font-bold text-brand-700">
                        {formatBDT(msg.structuredRfq.budget?.total_budget_bdt || 0)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleApplyRfq(msg.structuredRfq)}
                  >
                    <span>Send RFQ to Venue Providers</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-canvas-alt border border-line text-brand-700">
              <Bot className="size-4" />
            </div>
            <div className="rounded-2xl bg-canvas-alt border border-line px-4 py-3 text-xs text-ink-muted flex items-center gap-1.5 shadow-sm">
              <div className="size-2 rounded-full bg-brand-500 animate-bounce" />
              <div className="size-2 rounded-full bg-violet animate-bounce [animation-delay:0.2s]" />
              <div className="size-2 rounded-full bg-pink animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px]">Analyzing venues and pricing standards...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT FORM */}
      <div className="border-t border-line bg-surface p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Dhaka venues, budget splits, AV needs, or negotiation..."
            className="flex-1 rounded-btn border border-line bg-canvas-alt px-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim() || isTyping}
            className="shrink-0 h-10 px-4 gap-1.5"
          >
            <Send className="size-3.5" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
        <div className="mt-2 flex items-center justify-between text-[11px] text-ink-muted">
          <span>AI outputs are calibrated to real Bangladesh commercial and university venue rates.</span>
          <span className="font-semibold text-brand-600">Aayojon AI 2.0</span>
        </div>
      </div>
    </div>
  );
}

