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
import { useAuth } from "@/lib/firebase/auth-context";
import { dispatchStateAction } from "@/lib/client-api";
import type { VenueRequest } from "@/lib/types";

export interface AIMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  structuredRfq?: Partial<VenueRequest>;
  savedRfqId?: string;
  savedToAccount?: boolean;
  dispatchedCount?: number;
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

function defaultEventDateIso(daysAhead = 30): string {
  const d = new Date(Date.now() + daysAhead * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function synthesizeCustomRfq(query: string): {
  rfq: Partial<VenueRequest>;
  budget: NonNullable<AIMessage["budgetBreakdown"]>;
  city: string;
  guests: number;
} {
  const lower = query.toLowerCase();
  const guestMatch = query.match(/(\d{2,5})\s*(?:guests?|people|persons?|attendees?|pax|জন)/i);
  const guests = guestMatch ? Math.min(5000, Math.max(20, parseInt(guestMatch[1], 10))) : 200;

  const cities = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna"];
  const matchedCity = cities.find((c) => lower.includes(c.toLowerCase())) || "Dhaka";

  const isConcert = /concert|music|festival|cultural|band|night/i.test(query);
  const isWorkshop = /workshop|seminar|training|bootcamp|meetup/i.test(query);
  const isWedding = /wedding|reception|holud|gala|dinner/i.test(query);

  const eventType = isConcert
    ? "Live Concert & Cultural Festival"
    : isWorkshop
    ? "Workshop & Seminar"
    : isWedding
    ? "Gala & Banquet Reception"
    : "Corporate Conference & Summit";

  const venue = Math.round(guests * (isConcert ? 350 : 280));
  const soundLighting = isConcert ? 45000 : 18000;
  const catering = Math.round(guests * (isWedding ? 650 : 350));
  const stageFabrication = isConcert ? 30000 : 12000;
  const subtotal = venue + soundLighting + catering + stageFabrication;
  const contingency = Math.round(subtotal * 0.08);
  const total = subtotal + contingency;

  const rfq: Partial<VenueRequest> = {
    event_title: `${matchedCity} ${eventType.split(" & ")[0]} (${guests} Guests)`,
    event_type: eventType,
    description: query.slice(0, 260),
    event_date: defaultEventDateIso(30),
    start_time: "09:00",
    end_time: "21:00",
    expected_guests: guests,
    location_requirements: {
      city: matchedCity,
      preferred_areas: matchedCity === "Dhaka" ? ["Gulshan", "Banani", "Farmgate"] : [matchedCity],
      venue_category: isConcert ? "CONVENTION_CENTER" : "AUDITORIUM",
      indoor_outdoor: isConcert ? "ANY" : "INDOOR",
      required_facilities: ["AC", "GENERATOR", "PARKING", "WIFI"],
    },
    budget: {
      total_budget_bdt: total,
      venue_only_budget_bdt: venue,
      services_budget_bdt: soundLighting + catering + stageFabrication,
      flexible: true,
    },
  };

  return {
    rfq,
    budget: { venue, soundLighting, catering, stageFabrication, contingency, total },
    city: matchedCity,
    guests,
  };
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

function isGreetingOrChitchat(query: string): boolean {
  const clean = query.toLowerCase().replace(/[^\w\s]/g, "").trim();
  if (!clean) return true;
  const greetings = [
    "hi",
    "hello",
    "hey",
    "hii",
    "helo",
    "assalamu alaikum",
    "salam",
    "good morning",
    "good afternoon",
    "good evening",
    "how are you",
    "whats up",
    "sup",
    "thanks",
    "thank you",
    "ok",
    "okay",
    "test",
  ];
  if (greetings.includes(clean)) return true;
  const hasEventIntent =
    /\d{2,}/.test(clean) ||
    /(event|venue|hall|auditorium|rfq|budget|hackathon|concert|workshop|seminar|conference|wedding|party|demo|startup|catering|sound|stage|dhaka|chattogram|sylhet|rajshahi|khulna|plan|book|host|organize)/i.test(
      clean
    );
  return clean.split(/\s+/).length <= 3 && !hasEventIntent;
}

function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function FormattedChatText({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((raw, idx) => {
        const line = raw.trim();
        if (!line) return <div key={idx} className="h-1" />;
        if (line.startsWith("### ")) {
          return (
            <h4
              key={idx}
              className={`text-xs sm:text-sm font-extrabold tracking-tight pt-1 ${
                isUser ? "text-white" : "text-ink"
              }`}
            >
              {renderInlineBold(line.slice(4))}
            </h4>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className={`mt-1.5 size-1.5 rounded-full shrink-0 ${isUser ? "bg-white/80" : "bg-brand-600"}`} />
              <span>{renderInlineBold(line.slice(2))}</span>
            </div>
          );
        }
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={idx}
              className={`border-l-2 pl-3 italic ${
                isUser ? "border-white/50 text-white/90" : "border-brand-400 text-ink-muted"
              }`}
            >
              {renderInlineBold(line.slice(2).replace(/^\*|\*$/g, ""))}
            </blockquote>
          );
        }
        return <p key={idx}>{renderInlineBold(line)}</p>;
      })}
    </div>
  );
}

interface AIAssistantWidgetProps {
  onTransferToRfq?: (rfq: Partial<VenueRequest>) => void;
  standalone?: boolean;
}

export function AIAssistantWidget({ onTransferToRfq, standalone = false }: AIAssistantWidgetProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
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

    setTimeout(async () => {
      const lower = query.toLowerCase();
      let responseText = "";
      let structuredRfq: Partial<VenueRequest> | undefined = undefined;
      let budgetBreakdown: AIMessage["budgetBreakdown"] | undefined = undefined;

      // 1. Try live-DB RAG endpoint (/api/rag-chat) first when deployed on Vercel
      const isStaticGuide =
        lower.includes("negotiation") ||
        lower.includes("discount") ||
        lower.includes("script") ||
        lower.includes("sound") ||
        lower.includes("generator") ||
        lower.includes("line item") ||
        lower.includes("exclusion");

      if (!isStaticGuide) {
        try {
          const ragRes = await fetch("/api/rag-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query,
              projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "",
            }),
          });
          const ct = ragRes.headers.get("content-type") || "";
          if (ragRes.ok && ct.includes("application/json")) {
            const ragJson = await ragRes.json();
            if (ragJson?.replyText) {
              responseText = ragJson.replyText;
              budgetBreakdown = ragJson.budgetBreakdown;
              structuredRfq = ragJson.structuredRfq;
            }
          }
        } catch {
          // Local dev / static fallback continues below
        }
      }

      if (responseText) {
        // Already populated by /api/rag-chat
      } else if (lower.includes("hackathon") || lower.includes("400")) {
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
          event_date: defaultEventDateIso(30),
          start_time: "09:00",
          end_time: "21:00",
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
          event_date: defaultEventDateIso(21),
          start_time: "15:00",
          end_time: "21:00",
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
      } else if (
        /(password|secret|admin key|api key|credit card|nid|ssn|hack|exploit|sql|python|javascript|homework|essay|bitcoin|crypto|medical|diagnosis)/i.test(
          query
        )
      ) {
        responseText =
          "I can only assist with **Aayojon events, venues, vendors, budgets, and RFQ planning** in Bangladesh. I cannot access private account data or answer unrelated topics.";
      } else if (isGreetingOrChitchat(query)) {
        responseText =
          "Hello! Welcome to **Aayojon AI**.\n\nTell me about the event you are planning — such as the **event type**, **city** (Dhaka, Chattogram, Sylhet, etc.), **expected guests**, and **target budget** — and I will recommend matching venues, break down costs, and prepare an RFQ for you.";
      } else if (
        !/(plan|organize|host|create|send|generate|draft|book|rfq|quotation|quote)/i.test(query) ||
        !(/\d{2,}/.test(query) || /(hackathon|conference|workshop|concert|demo day|wedding|gala|summit)/i.test(query))
      ) {
        responseText =
          "I can help you explore **Aayojon events and partner venues** across Bangladesh.\n\nIf you'd like me to generate a budget breakdown and send an RFQ to matching providers, please share your **event type**, **city**, and **expected guest count** (for example: *Plan a 300-person tech conference in Dhaka*).";
      } else {
        const custom = synthesizeCustomRfq(query);
        structuredRfq = custom.rfq;
        budgetBreakdown = custom.budget;
        responseText = `### Tailored Event & Venue Plan (${custom.city} · ${custom.guests} Guests)\n\nBased on your request, I have prepared a realistic Bangladesh market budget breakdown and synthesized a structured RFQ draft:\n\n- **Recommended Setup:** ${custom.rfq.event_type} in **${custom.city}** with AC, standby generator, Wi-Fi, and parking.\n- **Estimated Total Budget:** **${formatBDT(custom.budget.total)}** (including 8% logistical contingency).\n- **Payment Practice:** Standard venue booking deposits range between 30% and 50%, verified before gate opening.`;
      }

      let savedRfqId: string | undefined;
      let savedToAccount = false;
      let dispatchedCount = 0;

      if (structuredRfq && currentUser?.uid) {
        try {
          const rfqPayload = {
            ...structuredRfq,
            organizer_user_id: currentUser.uid,
            additional_services: structuredRfq.additional_services || [],
            target_provider_ids: structuredRfq.target_provider_ids || [],
            attachments: structuredRfq.attachments || [],
            status: "SUBMITTED",
          };
          const res = (await dispatchStateAction(
            "SUBMIT_VENUE_RFQ",
            rfqPayload,
            currentUser.uid
          )) as { result?: VenueRequest };
          if (res?.result?.id) {
            savedRfqId = res.result.id;
            savedToAccount = true;
            dispatchedCount = res.result.target_provider_ids?.length || 0;
            structuredRfq = res.result;
          }
        } catch (err) {
          console.warn("[AI Assistant] Auto-save RFQ notice:", err);
        }
      }

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: responseText,
        structuredRfq,
        savedRfqId,
        savedToAccount,
        dispatchedCount,
        budgetBreakdown,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 650);
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

  if (!currentUser) {
    return (
      <div className="rounded-card border border-line bg-surface p-8 text-center shadow-card space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 border border-brand-200 text-brand-600">
          <Sparkles className="size-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-ink">Sign In Required for AI Event Assistant</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Sign in to chat with the AI Event Assistant, auto-save synthesized RFQs under your account, and dispatch them directly to matching Venue &amp; Vendor providers.
          </p>
        </div>
        <Link
          href="/login?returnUrl=/ai-event-assistant"
          className="inline-flex items-center gap-2 rounded-btn bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
        >
          <span>Sign In to Continue</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${
        standalone
          ? "h-[calc(100dvh-10.5rem)] min-h-[480px] max-h-[760px]"
          : "h-full min-h-[420px]"
      } bg-surface rounded-card border border-line shadow-card overflow-hidden`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 border-b border-line bg-canvas-alt px-3.5 sm:px-5 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-1.5 flex-wrap">
              <span className="truncate">Aayojon AI Assistant</span>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 shrink-0">
                Live DB RAG
              </span>
            </h2>
            <p className="text-[11px] text-ink-muted truncate">
              Venue discovery, budget splits &amp; auto-dispatched RFQs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessages(INITIAL_MESSAGES)}
            className="text-xs h-8 px-2.5 sm:px-3 gap-1"
            aria-label="Reset Chat"
          >
            <RefreshCw className="size-3.5" />
            <span className="hidden sm:inline">Reset Chat</span>
          </Button>
        </div>
      </div>

      {/* QUICK PRESET CHIPS */}
      <div className="border-b border-line bg-canvas/60 px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-x-auto touch-pan-x text-xs no-scrollbar">
        <span className="text-[11px] font-semibold text-ink-muted shrink-0 mr-1 flex items-center gap-1">
          <Zap className="size-3 text-brand-600" /> Prompts:
        </span>
        {PRESET_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(p.query)}
            className="whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-medium text-ink-muted hover:border-brand-300 hover:text-brand-700 hover:bg-canvas-alt active:scale-95 transition cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* CHAT MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 sm:gap-3 max-w-[96%] sm:max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 ${
                msg.sender === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-canvas-alt border border-line text-brand-700"
              }`}
            >
              {msg.sender === "user" ? <User className="size-3.5 sm:size-4" /> : <Bot className="size-3.5 sm:size-4" />}
            </div>

            <div className="space-y-2.5 min-w-0 flex-1">
              <div
                className={`rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-brand-600 text-white shadow-sm rounded-tr-sm"
                    : "bg-canvas-alt border border-line text-ink shadow-sm rounded-tl-sm"
                }`}
              >
                <FormattedChatText text={msg.text} isUser={msg.sender === "user"} />
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
                <div className="rounded-card border border-brand-200 bg-brand-50/50 p-3.5 sm:p-4 text-ink shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-200 pb-2">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-brand-900">
                      <Calculator className="size-3.5 text-brand-600 shrink-0" /> Recommended Budget Breakdown
                    </span>
                    <span className="font-extrabold text-sm text-brand-700">
                      {formatBDT(msg.budgetBreakdown.total)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
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
                <div className="rounded-card border-2 border-brand-400 bg-surface p-3.5 sm:p-4 shadow-md space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={msg.savedToAccount ? "success" : "brand"}>
                      {msg.savedToAccount
                        ? `✓ Saved & Sent to ${msg.dispatchedCount || 0} Providers`
                        : "Synthesized RFQ Draft"}
                    </Badge>
                    <span className="text-[11px] text-ink-muted font-mono truncate">
                      {msg.savedRfqId ? `Ref: ${msg.savedRfqId}` : "Sign in to auto-save"}
                    </span>
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

                  {currentUser ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleApplyRfq(msg.structuredRfq)}
                    >
                      <span>{msg.savedToAccount ? "Open Saved RFQ in Studio" : "Send RFQ to Venue Providers"}</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  ) : (
                    <Link
                      href="/login?returnUrl=/ai-event-assistant"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition"
                    >
                      <span>Sign In to Auto-Save RFQ to Your Account</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  )}
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
      <div className="border-t border-line bg-surface p-3 sm:p-4">
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
            placeholder="Describe your event, city, guests & budget..."
            className="flex-1 min-w-0 h-11 rounded-btn border border-line bg-canvas-alt px-3.5 sm:px-4 text-base sm:text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim() || isTyping}
            className="shrink-0 h-11 px-3.5 sm:px-4 gap-1.5"
            aria-label="Send message"
          >
            <Send className="size-4 sm:size-3.5" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
        <div className="mt-2 hidden sm:flex items-center justify-between text-[11px] text-ink-muted">
          <span>Calibrated to live Aayojon venue &amp; vendor rates across Bangladesh.</span>
          <span className="font-semibold text-brand-600">Aayojon AI</span>
        </div>
      </div>
    </div>
  );
}

