# Aayojon — All-in-One Event Discovery, Management, Promotion & Ticketing Platform

**Aayojon** (`aayojon.bd`) is a modular-monolith full-stack web platform built from the 11-document specification pack (`Event_Management_Platform_Complete_Documentation_Pack`).

## Architecture & Stack (`02_System_Architecture.docx`)
- **Frontend & UI**: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- **Backend API**: Next.js App Router Route Handlers (`/api/v1/...`)
- **Database Schema**: PostgreSQL / Supabase DDL (`supabase/migrations/0001_aayojon_schema.sql`) + Transactional Engine (`src/lib/db.ts`) storing all currency amounts in integer minor units (`paisa`, `BDT`).

## Per-Event Monetization Tiers (`01_Product_Requirements_Document.docx`)
- **Draft Event Creation**: Free (`৳0`)
- **Basic**: `৳799 / event` — Publish event, registration, attendee list, basic analytics
- **Promoted**: `৳1,499 / event` — Basic + boosted listing & UTM campaign tools
- **Plus**: `৳2,699 / event` — Promoted + advanced funnel analytics & custom branding / domain
- **Premium**: `৳4,999 / event` — Plus + homepage hero spotlight & priority support
- **Featured Placement Add-on**: `+৳500`

## Running & Testing
```bash
npm test        # Runs all 14 critical QA test cases (QA-001 through QA-014)
npm run dev     # Starts local development server
npm run build   # Production Next.js build
```

# 4-2
