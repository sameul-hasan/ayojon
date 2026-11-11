# Project: Aayojon (আয়োজন) Event Management Platform Modernization

## Architecture
- **Framework & Runtime**: Next.js 16.2.9 (App Router) + React 19.2.8 + TypeScript 5.9.3 + Tailwind CSS 4.3.1.
- **Client Shell**: `src/app/page.tsx` serving as single-page multi-portal router for Marketplace, Wallet, Organizer, Scanner, Sponsor, and Admin.
- **Styling Architecture**: Clean, accessible, minimal light theme based on slate palette (`bg-slate-50` canvas, `bg-white` cards with `border-slate-200`, `text-slate-900` headings, `text-slate-600` body, `bg-emerald-600` primary brand action, WCAG 2.1 AA contrast).
- **Authentication**: Firebase Authentication SDK with `AuthProvider` React context, supporting email/password sign-in/up and bridging existing 6 persona demo profiles (`usr-attendee-rafiq`, `usr-org-nusrat`, `usr-org-tanvir`, `usr-staff-mehedi`, `usr-sponsor-farhana`, `usr-admin-tariq`).
- **Database & Persistence**: Cloud Firestore with dual-mode architecture: live Firestore adapter when configured, transparent in-memory / JSON fallback (`MemoryJsonAdapter`) for deterministic offline execution and unit testing. Atomic transactions for ticket inventory and gate check-in idempotency.
- **Testing Architecture**: Dual-track requirement-driven E2E suite (Tiers 1-4) plus automated test suite (`npm test`) validating Firebase Auth, Firestore operations, and all 14 domain QA invariants.

## Feature Inventory
| # | Feature ID | Description | Milestone | Source |
|---|------------|-------------|-----------|--------|
| 1 | FEAT-AUTH-001 | Firebase App Configuration & SDK Setup (`src/lib/firebase/config.ts`, `src/lib/firebase/client.ts`) | M1 | Survey |
| 2 | FEAT-AUTH-002 | Firebase Authentication Provider & Context Hooks (`src/lib/firebase/auth-context.tsx`) | M1 | Survey |
| 3 | FEAT-AUTH-003 | Dual-Mode Persona Bridge (linking mock personas to Firebase Auth sessions) | M1 | Survey |
| 4 | FEAT-AUTH-004 | API Route Auth Middleware & Token Verification (`src/lib/firebase/auth-middleware.ts`) | M1 | Survey |
| 5 | FEAT-DB-001 | Firestore Data Models, Collections & Type Converters (`src/lib/firebase/firestore-schema.ts`) | M2 | Survey |
| 6 | FEAT-DB-002 | Firestore Database Adapter for CRUD Operations (events, registrations, orders, tickets, check-ins) | M2 | Survey |
| 7 | FEAT-DB-003 | Atomic Firestore Transactions (ticket inventory capacity decrement, gate scan single-use) | M2 | Survey |
| 8 | FEAT-DB-004 | Dual-Mode Persistence Fallback (in-memory test adapter for offline zero-breakage testing) | M2 | Survey |
| 9 | FEAT-DB-005 | Declarative Firestore Security Rules (`firestore.rules`) with Role-Based Access Control | M2 | Survey |
| 10 | FEAT-UI-001 | Light Theme System, Variables & Design Tokens (`layout.tsx`, `scripts/build-css.cjs`, `globals.css`) | M3 | Survey |
| 11 | FEAT-UI-002 | Application Shell, Navigation & Portal Switching Light Theme (`src/app/page.tsx`) | M3 | Survey |
| 12 | FEAT-UI-003 | `MarketplaceView` Minimal Light Theme (hero, search, filters, event cards, detail & checkout modal) | M4 | Survey |
| 13 | FEAT-UI-004 | `AttendeeWalletView` Minimal Light Theme (summary cards, QR passes, test scan, order history table) | M4 | Survey |
| 14 | FEAT-UI-005 | `SponsorMarketplaceView` Minimal Light Theme (header, event cards, inquiry form, proposals table) | M4 | Survey |
| 15 | FEAT-UI-006 | `OrganizerWorkspaceView` Minimal Light Theme (tenant selector, KPIs, wizard, attendees, UTM, DNS) | M5 | Survey |
| 16 | FEAT-UI-007 | `CheckInScannerView` Minimal Light Theme (scanner header, event filter, validation card, recent scans) | M5 | Survey |
| 17 | FEAT-UI-008 | `AdminConsoleView` Minimal Light Theme (moderation table, suspend/restore, audit trail, queue flush) | M5 | Survey |
| 18 | FEAT-TEST-001 | Automated Test Runner & Firebase Auth/DB Tests (`npm test` expansion) | M6 / E2E Track | Survey |
| 19 | FEAT-TEST-002 | Comprehensive 4-Tier E2E Test Suite (Tiers 1-4 opaque-box requirement tests) | E2E Track | Survey |
| 20 | FEAT-VERIF-001 | Visual, Contrast, and Responsive DevTools Verification across all 6 views | M6 / E2E Track | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Firebase Auth & Configuration | FEAT-AUTH-001, FEAT-AUTH-002, FEAT-AUTH-003, FEAT-AUTH-004 | none | IN_PROGRESS |
| M2 | Cloud Firestore Database Integration | FEAT-DB-001, FEAT-DB-002, FEAT-DB-003, FEAT-DB-004, FEAT-DB-005 | M1 | PLANNED |
| M3 | Light Theme System & Shared Shell | FEAT-UI-001, FEAT-UI-002 | none | DONE |
| M4 | Light Theme Public & Attendee Views | FEAT-UI-003, FEAT-UI-004, FEAT-UI-005 | M3 | IN_PROGRESS |
| M5 | Light Theme Organizer & Operations Views | FEAT-UI-006, FEAT-UI-007, FEAT-UI-008 | M3 | IN_PROGRESS |
| M6 | Final Milestone: 100% E2E Pass & Adversarial Hardening | Phase 1: 100% E2E test pass (Tiers 1-4); Phase 2: Tier 5 adversarial hardening | M1, M2, M4, M5, TEST_READY | PLANNED |
| E2E | E2E Testing Track | TEST_INFRA.md, 4-tier opaque-box test runner & cases, TEST_READY.md | none (parallel track) | IN_PROGRESS |

## Interface Contracts

### Auth Context ↔ UI Views & Components
- `useAuth()` hook provides:
  ```typescript
  interface AuthContextValue {
    currentUser: UserProfile | null;
    firebaseUser: any | null;
    activeRole: UserRole;
    loading: boolean;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    signOutUser: () => Promise<void>;
    switchPersona: (personaUserId: string) => Promise<void>;
  }
  ```

### Database Adapter ↔ API Handlers & UI State
- `DatabaseAdapter` interface:
  ```typescript
  interface DatabaseAdapter {
    getState(): Promise<DatabaseState>;
    getEvents(filter?: EventFilter): Promise<Event[]>;
    getEventById(id: string): Promise<Event | null>;
    createRegistration(registration: RegistrationInput): Promise<RegistrationResult>;
    purchaseTicket(orderInput: OrderInput): Promise<OrderResult>;
    validateGateTicket(tokenOrHash: string, eventId?: string): Promise<GateScanResult>;
    saveState(state: DatabaseState): Promise<void>;
    resetToSeed(): Promise<DatabaseState>;
  }
  ```

### Design Token System ↔ All Views
- Canvas background: `bg-slate-50` (`#f8fafc`)
- Card & container surface: `bg-white` (`#ffffff`) with border `border-slate-200` (`#e2e8f0`)
- Text hierarchy:
  - Primary headings / titles: `text-slate-900` (`#0f172a`)
  - Body text: `text-slate-600` (`#475569`)
  - Muted captions: `text-slate-500` (`#64748b`)
- Accent & Brand actions:
  - Primary button: `bg-emerald-600 hover:bg-emerald-700 text-white`
  - Secondary button: `bg-white border border-slate-300 text-slate-700 hover:bg-slate-50`
  - Accent badge: `bg-emerald-50 text-emerald-700 border border-emerald-200`
- Form inputs: `bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600`
- Modals: `bg-white border-slate-200 shadow-2xl` with backdrop `bg-slate-900/40 backdrop-blur-sm`

## Code Layout
- `src/lib/firebase/config.ts` — Firebase configuration loader (env + defaults)
- `src/lib/firebase/client.ts` — Firebase app initialization
- `src/lib/firebase/auth-context.tsx` — Auth React context & hooks
- `src/lib/firebase/auth-middleware.ts` — Token validator for API routes
- `src/lib/firebase/firestore-schema.ts` — Types and Firestore converters
- `src/lib/firebase/firestore-adapter.ts` — Firestore implementation of DatabaseAdapter
- `src/lib/firebase/memory-adapter.ts` — In-memory test & fallback adapter
- `src/lib/firebase/index.ts` — Barrel export for Firebase services
- `src/lib/db.ts` — Unified database gateway consuming DatabaseAdapter
- `firestore.rules` — Declarative security rules
- `scripts/build-css.cjs` — Tailwind CSS builder with light theme root variables
- `src/app/layout.tsx` — Root HTML layout with light theme attributes
- `src/app/page.tsx` — Main application shell and portal router
- `src/components/MarketplaceView.tsx` — Event discovery, search, ticket checkout
- `src/components/AttendeeWalletView.tsx` — Attendee passes, QR verification, orders
- `src/components/OrganizerWorkspaceView.tsx` — Organizer dashboard, event wizard, metrics
- `src/components/CheckInScannerView.tsx` — Staff gate check-in terminal
- `src/components/SponsorMarketplaceView.tsx` — Brand sponsorship proposals
- `src/components/AdminConsoleView.tsx` — Platform admin, event moderation, audit log
- `src/components/QrMatrixSvg.tsx` — QR code SVG renderer
- `tests/` — Test suites (`qa-suite.test.ts`, `firebase-auth.test.ts`, `firebase-firestore.test.ts`, `test-runner.ts`)
- `tests/e2e/` — Requirement-driven E2E test suite (Tiers 1-4)
