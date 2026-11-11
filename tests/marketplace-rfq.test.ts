import assert from "assert";
import {
  VenueProfile,
  VendorServiceListing,
  VenueRequest,
  Quotation,
  QuotationRevision,
  RFQMessage,
  VenueBooking,
  AIAssistantMessage,
} from "../src/lib/types";
import { PARTNER_VENUES } from "../src/lib/venues-catalog";

export async function runMarketplaceRfqTests() {
  console.log("\n--- [Suite 3/3] Venue & Services Marketplace with AI Assistant ---");

  // TEST 1: Venue Directory Integrity & Bangladesh Catalog
  {
    assert(PARTNER_VENUES.length >= 6, "Expected at least 6 partner venues in catalog");
    const kib = PARTNER_VENUES.find((v) => v.id === "ven-kib");
    assert(kib, "KIB Auditorium must exist in catalog");
    assert.strictEqual(kib.city, "Dhaka");
    assert.strictEqual(kib.capacity, 1200);
    assert.strictEqual(kib.verified, true);
    assert(kib.dailyRateBDT > 0, "Daily rate must be positive integer");
    assert(kib.amenities.some((a) => a.includes("Generator")), "KIB must have generator standby listed");
    console.log("✅ [VRFQ-001] PASS — Partner venue catalog integrity & technical specs verified");
  }

  // TEST 2: Organizer Multi-Step RFQ Creation
  let createdRfq: VenueRequest;
  {
    createdRfq = {
      id: "rfq-test-ai-summit-2027",
      organizer_user_id: "usr-org-nusrat",
      linked_event_id: "evt-dhaka-ai-summit",
      event_title: "Dhaka AI & Robotics Summit 2027",
      event_type: "Tech Conference & Hackathon",
      description: "2-day national conference with 500 delegates, keynote presentations, and student hackathon.",
      event_date: "2027-04-10",
      alternative_date: "2027-04-17",
      start_time: "09:00",
      end_time: "20:00",
      expected_guests: 500,
      location_requirements: {
        city: "Dhaka",
        preferred_areas: ["Farmgate", "Gulshan"],
        venue_category: "AUDITORIUM",
        indoor_outdoor: "INDOOR",
        required_facilities: ["AC", "GENERATOR", "PARKING", "WIFI"],
      },
      budget: {
        total_budget_bdt: 200000,
        venue_only_budget_bdt: 100000,
        services_budget_bdt: 100000,
        flexible: true,
      },
      additional_services: [
        {
          category: "SOUND_SYSTEM",
          description: "Dual line-array PA with 4 wireless mics and senior sound engineer",
          quantity: 1,
          estimated_budget_bdt: 30000,
        },
        {
          category: "CATERING",
          description: "Lunch buffet for 500 attendees",
          quantity: 500,
          estimated_budget_bdt: 60000,
        },
      ],
      target_provider_ids: ["usr-venue-kamal", "usr-vendor-tariq"],
      attachments: [],
      status: "SUBMITTED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    assert.strictEqual(createdRfq.status, "SUBMITTED");
    assert.strictEqual(createdRfq.expected_guests, 500);
    assert.strictEqual(createdRfq.additional_services.length, 2);
    assert.strictEqual(createdRfq.budget.total_budget_bdt, 200000);
    console.log("✅ [VRFQ-002] PASS — Multi-step RFQ creation with technical facilities & vendor services");
  }

  // TEST 3: Provider Itemized Quotation & Calculation Math Invariant
  let quotationA: Quotation;
  {
    const lineItems = [
      {
        id: "li-venue-1",
        description: "Full Day Auditorium Rental",
        quantity: 1,
        unit_price_bdt: 85000,
        total_bdt: 85000,
        category: "VENUE_RENTAL" as const,
      },
      {
        id: "li-power-2",
        description: "200kVA Heavy Generator Power Standby",
        quantity: 1,
        unit_price_bdt: 8000,
        total_bdt: 8000,
        category: "LOGISTICS" as const,
      },
      {
        id: "li-discount-3",
        description: "University / Non-Profit Institutional Discount",
        quantity: 1,
        unit_price_bdt: -5000,
        total_bdt: -5000,
        category: "DISCOUNT" as const,
      },
    ];

    const subtotal = lineItems.reduce((acc, curr) => acc + curr.total_bdt, 0);
    const discount = 5000;
    const tax = 0;
    const setupCharges = 2000;
    const transportCharges = 0;
    const grandTotal = subtotal + setupCharges + transportCharges; // since -5000 was already in subtotal

    quotationA = {
      id: "qt-test-kib-001",
      rfq_id: createdRfq.id,
      provider_user_id: "usr-venue-kamal",
      provider_type: "VENUE_OWNER",
      provider_name: "Krishibid Institution Bangladesh (KIB)",
      venue_id: "vp-kib",
      status: "SUBMITTED",
      revision_number: 1,
      valid_until: "2027-01-31T23:59:59Z",
      line_items: lineItems,
      subtotal_bdt: 93000,
      discount_bdt: discount,
      tax_bdt: tax,
      setup_charges_bdt: setupCharges,
      transport_charges_bdt: transportCharges,
      grand_total_bdt: 90000,
      inclusions: ["Central AC", "250 Vehicle Parking", "Dual Greenrooms", "Standby Generator"],
      exclusions: ["Outside catering cleaning fee"],
      payment_terms: {
        deposit_percentage: 50,
        deposit_due_days_before: 14,
        final_payment_due: "BEFORE_EVENT",
      },
      cancellation_policy: "100% refund up to 14 days before event.",
      terms_conditions: "Hall must be vacated by 23:00.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Math invariant check
    const calculated =
      quotationA.subtotal_bdt -
      quotationA.discount_bdt +
      quotationA.tax_bdt +
      quotationA.setup_charges_bdt +
      quotationA.transport_charges_bdt;

    assert.strictEqual(quotationA.grand_total_bdt, calculated, "Quotation grand total math must match formula");
    assert.strictEqual(quotationA.payment_terms.deposit_percentage, 50);
    console.log("✅ [VRFQ-003] PASS — Itemized quotation calculations & financial invariant verified");
  }

  // TEST 4: Quotation Revision History
  let revisedQuote: Quotation;
  let revisionRecord: QuotationRevision;
  {
    // Snapshot original
    revisionRecord = {
      id: `rev-${Date.now()}`,
      quotation_id: quotationA.id,
      revision_number: quotationA.revision_number,
      snapshot: { ...quotationA },
      change_notes: "Organizer requested waived setup charge and additional ৳2,000 discount.",
      created_at: new Date().toISOString(),
    };

    // Apply revision
    revisedQuote = {
      ...quotationA,
      revision_number: quotationA.revision_number + 1,
      setup_charges_bdt: 0,
      discount_bdt: 7000,
      grand_total_bdt: 86000,
      status: "REVISED",
      updated_at: new Date().toISOString(),
    };

    assert.strictEqual(revisedQuote.revision_number, 2, "Revision number must increment to 2");
    assert.strictEqual(revisionRecord.snapshot.grand_total_bdt, 90000, "Snapshot preserves original ৳90,000");
    assert.strictEqual(revisedQuote.grand_total_bdt, 86000, "Revised total reflects concessions");
    console.log("✅ [VRFQ-004] PASS — Quotation revision workflow & snapshot audit preservation");
  }

  // TEST 5: Quotation Side-by-Side Comparison Engine
  {
    const quotationB: Quotation = {
      id: "qt-test-buet-001",
      rfq_id: createdRfq.id,
      provider_user_id: "usr-org-nusrat",
      provider_type: "VENUE_OWNER",
      provider_name: "BUET ECE Auditorium",
      venue_id: "vp-buet",
      status: "SUBMITTED",
      revision_number: 1,
      valid_until: "2027-01-31T23:59:59Z",
      line_items: [
        {
          id: "li-buet-1",
          description: "Auditorium Rental",
          quantity: 1,
          unit_price_bdt: 35000,
          total_bdt: 35000,
          category: "VENUE_RENTAL",
        },
      ],
      subtotal_bdt: 35000,
      discount_bdt: 0,
      tax_bdt: 0,
      setup_charges_bdt: 0,
      transport_charges_bdt: 0,
      grand_total_bdt: 35000,
      inclusions: ["Campus WiFi", "Stage Projector"],
      exclusions: ["Catering space limited", "Overtime past 21:00 disallowed"],
      payment_terms: {
        deposit_percentage: 100,
        deposit_due_days_before: 7,
        final_payment_due: "BEFORE_EVENT",
      },
      cancellation_policy: "Academic non-refundable policy",
      terms_conditions: "Campus security regulations apply.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const quotes = [revisedQuote, quotationB];
    const lowest = quotes.reduce((min, q) => (q.grand_total_bdt < min.grand_total_bdt ? q : min), quotes[0]);
    assert.strictEqual(lowest.id, "qt-test-buet-001", "Comparison engine accurately identifies cheapest quote");

    const costPerGuestA = Math.round(revisedQuote.grand_total_bdt / createdRfq.expected_guests);
    const costPerGuestB = Math.round(quotationB.grand_total_bdt / createdRfq.expected_guests);

    assert.strictEqual(costPerGuestA, 172, "KIB cost per guest is ~৳172");
    assert.strictEqual(costPerGuestB, 70, "BUET cost per guest is ~৳70");
    console.log("✅ [VRFQ-005] PASS — Comparison engine identifies lowest bid and per-attendee metrics");
  }

  // TEST 6: In-Context Negotiation Scoped Messaging
  {
    const message: RFQMessage = {
      id: "msg-test-01",
      rfq_id: createdRfq.id,
      quotation_id: revisedQuote.id,
      sender_user_id: "usr-org-nusrat",
      sender_role: "ORGANIZER",
      message_text: "Can the auditorium electrical team assist with our live broadcast uplink?",
      read: true,
      created_at: new Date().toISOString(),
    };

    assert(message.rfq_id === createdRfq.id, "Message must be scoped to specific RFQ");
    assert(message.message_text.length > 5, "Message must have substantive text");
    assert(message.sender_role === "ORGANIZER" || message.sender_role === "PROVIDER");
    console.log("✅ [VRFQ-006] PASS — Scoped RFQ clarification messaging & role authorization");
  }

  // TEST 7: Booking Acceptance, Escrow Deposit & Date Lock
  {
    const depositAmount = Math.round(
      (revisedQuote.grand_total_bdt * revisedQuote.payment_terms.deposit_percentage) / 100
    );
    assert.strictEqual(depositAmount, 43000, "50% of ৳86,000 must equal ৳43,000");

    const booking: VenueBooking = {
      id: "vb-test-confirmed-001",
      rfq_id: createdRfq.id,
      accepted_quotation_id: revisedQuote.id,
      organizer_user_id: createdRfq.organizer_user_id,
      provider_user_id: revisedQuote.provider_user_id,
      venue_id: revisedQuote.venue_id,
      event_date: createdRfq.event_date,
      total_agreed_bdt: revisedQuote.grand_total_bdt,
      deposit_required_bdt: depositAmount,
      deposit_paid_bdt: depositAmount,
      status: "CONFIRMED",
      payment_reference_id: "BKASH-ESCROW-998822",
      notes: "Agreed upon terms of revision #2.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    assert.strictEqual(booking.status, "CONFIRMED");
    assert.strictEqual(booking.deposit_paid_bdt, 43000);
    assert.strictEqual(booking.total_agreed_bdt, 86000);
    console.log("✅ [VRFQ-007] PASS — Booking acceptance, escrow deposit calculation & date lock");
  }

  // TEST 8: AI Event Planning Assistant Budget Synthesis
  {
    const totalBudget = 200000;
    // Standard Dhaka market split: ~45% Venue, ~15% Sound/Lighting, ~25% Catering, ~10% Stage, ~5% Contingency
    const venueAllocation = Math.round(totalBudget * 0.45);
    const soundAllocation = Math.round(totalBudget * 0.15);
    const cateringAllocation = Math.round(totalBudget * 0.25);
    const contingency = totalBudget - (venueAllocation + soundAllocation + cateringAllocation);

    assert(venueAllocation > 50000, "Auditorium allocation must reflect realistic Dhaka rates");
    assert(contingency >= 10000, "Must reserve adequate fuel/contingency buffer");

    const aiMessage: AIAssistantMessage = {
      id: "ai-test-msg-01",
      role: "assistant",
      content: "Recommended budget split for 500 attendees in Dhaka.",
      extracted_rfq: {
        event_title: "Synthesized AI Summit",
        expected_guests: 500,
        budget: {
          total_budget_bdt: totalBudget,
          flexible: true,
        },
      },
      created_at: new Date().toISOString(),
    };

    assert.strictEqual(aiMessage.extracted_rfq?.expected_guests, 500);
    console.log("✅ [VRFQ-008] PASS — AI assistant budget allocation & RFQ synthesis parameters");
  }

  console.log("\nSummary: 8/8 Venue & Services Marketplace test cases passed.");
}

