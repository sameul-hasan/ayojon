/**
 * Vercel Serverless RAG Endpoint for Aayojon AI Event Assistant
 *
 * 100% Free Architecture:
 * - Retrieve: Live Cloud Firestore REST API (venue_profiles, vendor_services, events)
 *   with 60s in-memory cache so DB updates appear automatically in the next chat.
 * - Augment: Injects top matching venues, vendors, and BDT rates into the prompt.
 * - Generate: Uses Google Gemini (GEMINI_API_KEY, Free Tier) or Groq (GROQ_API_KEY, Free Tier),
 *   with a deterministic live-DB RAG fallback if no LLM key is configured.
 */

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
  nullValue?: null;
}

interface RagContextItem {
  id: string;
  kind: "venue" | "vendor" | "event";
  name: string;
  city: string;
  priceBdt: number;
  capacity?: number;
  summary: string;
  ownerUserId?: string;
}

const CACHE_TTL_MS = 60_000;
let cachedCatalog: { loadedAt: number; projectId: string; items: RagContextItem[] } | null = null;

function decodeFirestoreValue(val?: FirestoreValue): unknown {
  if (!val) return undefined;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.nullValue !== undefined) return null;
  if (val.arrayValue) return (val.arrayValue.values || []).map(decodeFirestoreValue);
  if (val.mapValue) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      out[k] = decodeFirestoreValue(v);
    }
    return out;
  }
  return undefined;
}

function decodeDoc(doc: { name?: string; fields?: Record<string, FirestoreValue> }): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields || {})) {
    out[k] = decodeFirestoreValue(v);
  }
  if (!out.id && doc.name) {
    out.id = doc.name.split("/").pop();
  }
  return out;
}

async function fetchFirestoreCollection(projectId: string, collectionName: string): Promise<Record<string, any>[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${collectionName}?pageSize=50`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = (await resp.json()) as { documents?: Array<{ name?: string; fields?: Record<string, FirestoreValue> }> };
  return (data.documents || []).map(decodeDoc);
}

async function loadLiveKnowledgeBase(projectId: string): Promise<RagContextItem[]> {
  const now = Date.now();
  if (cachedCatalog && cachedCatalog.projectId === projectId && now - cachedCatalog.loadedAt < CACHE_TTL_MS) {
    return cachedCatalog.items;
  }

  const items: RagContextItem[] = [];
  if (projectId) {
    try {
      const [venues, vendors, events] = await Promise.all([
        fetchFirestoreCollection(projectId, "venue_profiles"),
        fetchFirestoreCollection(projectId, "vendor_services"),
        fetchFirestoreCollection(projectId, "events"),
      ]);

      for (const v of venues) {
        items.push({
          id: String(v.id || ""),
          kind: "venue",
          name: String(v.name || "Partner Venue"),
          city: String(v.city || "Dhaka"),
          priceBdt: Number(v.base_price_bdt || v.daily_rate_bdt || 35000),
          capacity: Number(v.max_capacity || v.capacity || 300),
          summary: `${v.category || "Venue"} in ${v.area || v.city || "Dhaka"}, capacity ${v.max_capacity || v.capacity || 300}, facilities: ${(v.facilities || []).join(", ")}`,
          ownerUserId: v.owner_user_id ? String(v.owner_user_id) : undefined,
        });
      }

      for (const vs of vendors) {
        items.push({
          id: String(vs.id || ""),
          kind: "vendor",
          name: String(vs.title || "Vendor Service"),
          city: Array.isArray(vs.cities_served) && vs.cities_served[0] ? String(vs.cities_served[0]) : "Dhaka",
          priceBdt: Number(vs.base_price_bdt || 15000),
          summary: `${vs.category || "Service"} (${vs.unit || "PER_EVENT"}), serves ${(vs.cities_served || ["Dhaka"]).join(", ")}`,
          ownerUserId: vs.vendor_user_id ? String(vs.vendor_user_id) : undefined,
        });
      }

      for (const ev of events) {
        if (ev.status !== "PUBLISHED") continue;
        items.push({
          id: String(ev.id || ""),
          kind: "event",
          name: String(ev.title || "Event"),
          city: String(ev.city || "Dhaka"),
          priceBdt: 0,
          summary: `${ev.tagline || ev.category_id || "Public Event"} on ${ev.starts_at || ""}`,
        });
      }
    } catch {
      // Fall back gracefully if Firestore network fails
    }
  }

  cachedCatalog = { loadedAt: now, projectId, items };
  return items;
}

function retrieveTopContext(query: string, items: RagContextItem[], topK = 6): RagContextItem[] {
  const lower = query.toLowerCase();
  const tokens = lower.split(/\W+/).filter((t) => t.length > 2);
  const guestMatch = query.match(/(\d{2,5})\s*(?:guests?|people|persons?|attendees?|pax)/i);
  const targetGuests = guestMatch ? parseInt(guestMatch[1], 10) : 200;

  return [...items]
    .map((item) => {
      let score = item.kind === "venue" ? 2 : item.kind === "vendor" ? 1.5 : 0.5;
      const hay = `${item.name} ${item.city} ${item.summary}`.toLowerCase();
      for (const tok of tokens) {
        if (hay.includes(tok)) score += 3;
      }
      if (item.capacity && item.capacity >= targetGuests) {
        score += 2;
      }
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.item);
}

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
  // Very short message without event keywords or numbers
  const hasEventIntent =
    /\d{2,}/.test(clean) ||
    /(event|venue|hall|auditorium|rfq|budget|hackathon|concert|workshop|seminar|conference|wedding|party|demo|startup|catering|sound|stage|dhaka|chattogram|sylhet|rajshahi|khulna|plan|book|host|organize)/i.test(
      clean
    );
  return clean.split(/\s+/).length <= 3 && !hasEventIntent;
}

function needsRagLookup(query: string): boolean {
  return /(event|venue|hall|auditorium|rfq|budget|hackathon|concert|workshop|seminar|conference|wedding|party|demo|startup|catering|sound|lighting|stage|dhaka|chattogram|sylhet|rajshahi|khulna|price|cost|capacity|book|host|organize|vendor|provider|ticket|schedule)/i.test(
    query
  );
}

function wantsRfqSynthesis(query: string): boolean {
  const hasAction = /(plan|organize|host|create|send|generate|draft|book|need a venue|looking for a venue|rfq|quotation|quote)/i.test(
    query
  );
  const hasDetails = /\d{2,}/.test(query) || /(hackathon|conference|workshop|concert|demo day|wedding|gala|summit)/i.test(query);
  return hasAction && hasDetails;
}

function isOffTopic(query: string): boolean {
  return /(password|secret|admin key|api key|credit card|nid|ssn|hack|exploit|sql|python|javascript|homework|essay|bitcoin|crypto|medical|diagnosis)/i.test(
    query
  );
}

function buildFallbackRagResponse(query: string, retrieved: RagContextItem[]) {
  if (isOffTopic(query)) {
    return {
      source: "live-db-rag",
      retrievedCount: 0,
      replyText:
        "I can only assist with **Aayojon events, venues, vendors, budgets, and RFQ planning** in Bangladesh. I cannot access private account data or answer unrelated topics.",
      budgetBreakdown: undefined,
      structuredRfq: undefined,
    };
  }

  if (isGreetingOrChitchat(query) || !needsRagLookup(query)) {
    return {
      source: "live-db-rag",
      retrievedCount: 0,
      replyText:
        "Hello! Welcome to **Aayojon AI**. Ask me anything about upcoming events, partner venues, vendor services, or tell me your **event type, city, guest count, and budget** to plan and send an RFQ.",
      budgetBreakdown: undefined,
      structuredRfq: undefined,
    };
  }

  // If user is just asking about events or venues (without asking to plan/book/create RFQ), answer from RAG without creating an RFQ
  if (!wantsRfqSynthesis(query)) {
    const venueItems = retrieved.filter((r) => r.kind === "venue");
    const eventItems = retrieved.filter((r) => r.kind === "event");
    const lines: string[] = ["### Live Aayojon Catalog Results"];
    if (venueItems.length > 0) {
      lines.push("**Matching Venues:**");
      venueItems.slice(0, 4).forEach((v) => {
        lines.push(`- **${v.name}** (${v.city}) — ~৳${v.priceBdt.toLocaleString()} · Capacity ${v.capacity || "N/A"}`);
      });
    }
    if (eventItems.length > 0) {
      lines.push("**Upcoming Events:**");
      eventItems.slice(0, 4).forEach((e) => {
        lines.push(`- **${e.name}** (${e.city}) — ${e.summary}`);
      });
    }
    if (venueItems.length === 0 && eventItems.length === 0) {
      lines.push("No exact matches found in the live catalog right now. Try specifying a city like **Dhaka**, **Chattogram**, or **Sylhet**.");
    } else {
      lines.push("\nWant me to calculate a budget and send an RFQ? Just share your guest count and target date.");
    }
    return {
      source: "live-db-rag",
      retrievedCount: retrieved.length,
      replyText: lines.join("\n"),
      budgetBreakdown: undefined,
      structuredRfq: undefined,
    };
  }

  const lower = query.toLowerCase();
  const guestMatch = query.match(/(\d{2,5})\s*(?:guests?|people|persons?|attendees?|pax)/i);
  const guests = guestMatch ? Math.min(5000, Math.max(20, parseInt(guestMatch[1], 10))) : 200;
  const cities = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna"];
  const city = cities.find((c) => lower.includes(c.toLowerCase())) || "Dhaka";

  const topVenue = retrieved.find((r) => r.kind === "venue");
  const venueCost = topVenue?.priceBdt || Math.round(guests * 280);
  const soundLighting = 18000;
  const catering = Math.round(guests * 350);
  const stageFabrication = 12000;
  const contingency = Math.round((venueCost + soundLighting + catering + stageFabrication) * 0.08);
  const total = venueCost + soundLighting + catering + stageFabrication + contingency;

  const venueLine = topVenue
    ? `**Live DB Match:** **${topVenue.name}** (${topVenue.city}) — approx. ৳${topVenue.priceBdt.toLocaleString()}`
    : `**Recommended Setup:** Verified indoor auditorium/hall in **${city}**`;

  const providerIds = Array.from(
    new Set(retrieved.map((r) => r.ownerUserId).filter((id): id is string => Boolean(id)))
  );

  const eventDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  return {
    source: "live-db-rag",
    retrievedCount: retrieved.length,
    replyText: `### Live Database RAG Plan (${city} · ${guests} Guests)\n\n${venueLine}\n\n- **Estimated Total Budget:** ৳${total.toLocaleString()} (includes 8% generator & logistics contingency)\n- **Matched Providers:** ${retrieved.filter((r) => r.kind !== "event").map((r) => r.name).join(", ") || "Bangladesh Partner Network"}`,
    budgetBreakdown: {
      venue: venueCost,
      soundLighting,
      catering,
      stageFabrication,
      contingency,
      total,
    },
    structuredRfq: {
      event_title: `${city} Event (${guests} Guests)`,
      event_type: "Corporate & Community Event",
      description: query.slice(0, 260),
      event_date: eventDate,
      start_time: "09:00",
      end_time: "21:00",
      expected_guests: guests,
      target_provider_ids: providerIds,
      location_requirements: {
        city,
        preferred_areas: [city],
        venue_category: "AUDITORIUM",
        indoor_outdoor: "INDOOR",
        required_facilities: ["AC", "GENERATOR", "PARKING", "WIFI"],
      },
      budget: {
        total_budget_bdt: total,
        venue_only_budget_bdt: venueCost,
        services_budget_bdt: soundLighting + catering + stageFabrication,
        flexible: true,
      },
    },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const query = String(body.query || "").trim();
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    if (isOffTopic(query)) {
      return res.status(200).json({
        source: "guardrail",
        retrievedCount: 0,
        replyText:
          "I can only assist with **Aayojon events, venues, vendors, budgets, and RFQ planning** in Bangladesh. I cannot access private account data or answer unrelated topics.",
      });
    }

    const projectId =
      process.env.VITE_FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      String(body.projectId || "");

    // Only pull RAG context from DB when the query is about events, venues, vendors, or planning
    const shouldUseRag = needsRagLookup(query);
    const knowledgeBase = shouldUseRag ? await loadLiveKnowledgeBase(projectId) : [];
    const retrieved = shouldUseRag ? retrieveTopContext(query, knowledgeBase, 6) : [];
    const fallback = buildFallbackRagResponse(query, retrieved);

    // Strip internal IDs before passing retrieved catalog items to the LLM
    const sanitizedPromptContext = retrieved.map(({ name, kind, city, priceBdt, capacity, summary }) => ({
      kind,
      name,
      city,
      priceBdt,
      capacity,
      summary,
    }));

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const systemPrompt = `You are Aayojon AI, a helpful conversational assistant for the Aayojon Bangladesh event & venue platform.
${
  shouldUseRag
    ? `Retrieved Live Database Context (public events, venues & vendors):\n${JSON.stringify(sanitizedPromptContext, null, 2)}`
    : "No database lookup was needed for this message."
}

Strict Rules:
1. Act as a normal, friendly AI chat for Aayojon.
2. NEVER access, invent, or reveal private user data, emails, phone numbers, passwords, or irrelevant off-topic information (e.g., coding, politics, medical/legal advice). If asked off-topic questions, politely redirect to Aayojon events, venues, and planning.
3. For greetings, general chat, or simple catalog questions ("what venues are in Dhaka?", "what events are happening?"), answer naturally using the retrieved context and set "budgetBreakdown": null and "structuredRfq": null.
4. ONLY populate "budgetBreakdown" and "structuredRfq" when the user explicitly asks to plan/organize/host an event or create/send an RFQ with event details.

Return strict JSON with keys:
- replyText (clean markdown string)
- budgetBreakdown (null OR { venue, soundLighting, catering, stageFabrication, contingency, total } numbers in BDT)
- structuredRfq (null OR { event_title, event_type, description, expected_guests, location_requirements: { city, preferred_areas, venue_category, indoor_outdoor, required_facilities }, budget: { total_budget_bdt, venue_only_budget_bdt, services_budget_bdt, flexible } })`;

      const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
      for (const model of models) {
        const geminiResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: "user", parts: [{ text: query }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (geminiResp.ok) {
          const gJson = (await geminiResp.json()) as any;
          const rawText = gJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            return res.status(200).json({
              source: "gemini-live-rag",
              model,
              retrievedCount: retrieved.length,
              replyText: parsed.replyText || fallback.replyText,
              budgetBreakdown: parsed.budgetBreakdown || undefined,
              structuredRfq: parsed.structuredRfq
                ? {
                    ...(fallback.structuredRfq || {}),
                    ...parsed.structuredRfq,
                    target_provider_ids: fallback.structuredRfq?.target_provider_ids || [],
                  }
                : undefined,
            });
          }
        }
      }
    }

    return res.status(200).json(fallback);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "RAG processing failed" });
  }
}
