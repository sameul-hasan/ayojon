# Comprehensive Workspace Assessment & Improvement Roadmap
**Platform:** Aayojon Event Management & Ticketing Ecosystem  
**Target Directory:** `/Users/sameulhasan/Documents/Experiment`  
**Assessment Date:** 2026-11-12  
**Author:** Workspace Audit & Quality Assurance Engineering Taskforce  
**Status:** Official Production Improvement Specification  

---

## Table of Contents
1. [Executive Summary & System Overview](#1-executive-summary--system-overview)
   - [1.1 Health Score & Dimension Breakdown](#11-health-score--dimension-breakdown)
   - [1.2 Architecture Snapshot](#12-architecture-snapshot)
   - [1.3 Critical Risk Vectors](#13-critical-risk-vectors)
2. [Architecture & System Structure](#2-architecture--system-structure)
   - [2.1 Framework Drift: Vite SPA vs Obsolete Next.js Specifications](#21-framework-drift-vite-spa-vs-obsolete-nextjs-specifications)
   - [2.2 Production Static Deployment vs Dev Server API Middleware Disparity](#22-production-static-deployment-vs-dev-server-api-middleware-disparity)
   - [2.3 Component Architecture & Monoliths](#23-component-architecture--monoliths)
   - [2.4 Modularity & Bundle Optimization](#24-modularity--bundle-optimization)
3. [Code Quality, Security, Data Integrity & Maintainability](#3-code-quality-security-data-integrity--maintainability)
   - [3.1 Critical Security Vulnerabilities & Authorization Flaws](#31-critical-security-vulnerabilities--authorization-flaws)
   - [3.2 Schema Divergence & Data Integrity Bugs](#32-schema-divergence--data-integrity-bugs)
   - [3.3 Disconnected State Persistence](#33-disconnected-state-persistence)
   - [3.4 Performance & Scalability Bottlenecks](#34-performance--scalability-bottlenecks)
4. [Testing Infrastructure & Verification Readiness](#4-testing-infrastructure--verification-readiness)
   - [4.1 Test Suite Status: Active Suite vs Dead E2E Suite](#41-test-suite-status-active-suite-vs-dead-e2e-suite)
   - [4.2 Stress Test Suite Unhandled Rejection Crash](#42-stress-test-suite-unhandled-rejection-crash)
   - [4.3 Testing Blind Spots & Infrastructure Deficits](#43-testing-blind-spots--infrastructure-deficits)
5. [Prioritized Action Matrix](#5-prioritized-action-matrix)
6. [Execution Priorities & Phased Implementation Roadmap](#6-execution-priorities--phased-implementation-roadmap)
   - [Phase 1: Immediate Critical Security & Data Integrity Fixes (0–48 Hours)](#phase-1-immediate-critical-security--data-integrity-fixes-048-hours)
   - [Phase 2: Testing Infrastructure Resuscitation & CI/CD Pipeline (Week 1)](#phase-2-testing-infrastructure-resuscitation--cicd-pipeline-week-1)
   - [Phase 3: Architectural Realignment & Performance Optimization (Weeks 2–3)](#phase-3-architectural-realignment--performance-optimization-weeks-23)
   - [Phase 4: Maintainability, Frontend Tests & Code Cleansing (Weeks 3–4)](#phase-4-maintainability-frontend-tests--code-cleansing-weeks-34)

---

## 1. Executive Summary & System Overview

### 1.1 Health Score & Dimension Breakdown

An exhaustive, multi-dimensional technical assessment of the Aayojon event management and ticketing platform was conducted across the workspace `/Users/sameulhasan/Documents/Experiment`. The platform delivers a sophisticated feature set tailored to the Bangladeshi event market, including Mobile Financial Service (MFS) payment flows (bKash, Nagad), multi-role Role-Based Access Control (RBAC), partner venue Request For Quotations (RFQs), sponsor marketplaces, offline-capable gate scanner workflows, and interactive attendee ticket wallets.

However, beneath its feature-rich exterior, the codebase exhibits severe architectural drift, critical security bypasses, schema divergence leading to data loss, a dead 230-test end-to-end (E2E) testing suite, and significant bundle bloat.

```
+-----------------------------------------------------------------------+
|                       SYSTEM HEALTH SCORECARD                         |
+------------------------------------+---------+------------------------+
| Dimension                          | Score   | Status                 |
+------------------------------------+---------+------------------------+
| Architecture & Modularity          | 5.5/10  | Moderate Technical Debt|
| Security & Access Control          | 3.0/10  | CRITICAL EXPOSURE      |
| Code Quality & Data Integrity      | 5.0/10  | Severe Edge-Case Bugs  |
| Testing Infrastructure & CI/CD     | 4.0/10  | 71% of Tests Dead      |
| Performance & Scalability          | 5.5/10  | Unbounded Queries/I/O  |
+------------------------------------+---------+------------------------+
| COMPOSITE WORKSPACE HEALTH         | 4.6/10  | ACTION REQUIRED        |
+------------------------------------+---------+------------------------+
```

### 1.2 Architecture Snapshot

- **Client Runtime:** Pure Single-Page Application (SPA) built with React 19.2.8, React Router v7.18.3, and Vite 6.4.3.
- **Styling:** Tailwind CSS v4.3.1 pre-compiled via custom Node script (`scripts/build-css.cjs`).
- **Database & State:** Dual-mode persistence architecture:
  1. *Development / Preview:* In-memory Connect/Express-style HTTP middleware (`src/server/api-middleware.ts`) writing synchronously to a local JSON flat-file (`data/aayojon-db.json`).
  2. *Production / Static Host:* Direct client-side SDK integration with Google Cloud Firestore (`src/lib/firebase/firestore.ts`).
- **Authentication:** Firebase Authentication with client-side role claims and local mock fallback helpers (`src/lib/firebase/auth-middleware.ts`).

### 1.3 Critical Risk Vectors

1. **Firestore Rules Privilege Escalation (CRITICAL):** Regular authenticated users can elevate themselves to full database administrator by updating their own profile document with `platform_role: "ADMIN"`, granting complete read, write, and deletion privileges across the entire database (`firestore.rules:25-36, 86-88`).
2. **Mass PII and Ticket Forgery Exposure (CRITICAL):** Firestore security rules permit any authenticated user to read all orders and tickets across all organizations (exposing raw QR token secrets and customer PII) and write or update arbitrary tickets without payment verification (`firestore.rules:140-160`).
3. **Gate QR Check-in Bypass (CRITICAL):** The gate ticket validation engine accepts the plain ticket ID as equivalent to a cryptographic QR token (`t.id === trimmed`), allowing attendees or attackers to gain admission simply by presenting a predictable ticket ID (e.g. `tkt-1234abcd`) without possessing the cryptographic QR secret (`src/lib/db.ts:1000-1002`).
4. **Client Ticket Registration Schema Mismatch (HIGH):** Client-side ticket issuance omits `event_id`, `ticket_type_id`, `attendee_name`, `attendee_email`, and `token_hash`, setting an invalid status `"ISSUED"`. Consequently, newly booked tickets vanish from attendee wallets (`/api/v1/me/tickets`) and are immediately rejected at the venue gate with `INVALID_EVENT` (`src/lib/client-api.ts:268-274, 323-329`).
5. **Dormant E2E Test Suite (HIGH):** 230 comprehensive E2E tests (4,086 lines of code across Tiers 1–4) fail on initial require due to importing non-existent Next.js App Router route files (`src/app/api/v1/**/route.ts`). The CLI test runner silently catches and swallows the import failure, printing `"No tests matched the requested filters"` and exiting with code 0. Developers and CI are presented with a false 100% pass status (`tests/e2e/harness.ts:118-135`, `tests/e2e/runner.ts:141-146`).
6. **Unbounded Inventory Lock Denial of Service (HIGH):** Order creation immediately decrements ticket stock with status `PENDING`, but lacks any expiration time-to-live (TTL) or cleanup mechanism. Abandoned or uncompleted checkouts lock capacity permanently, allowing malicious users to exhaust event inventory without financial cost (`src/lib/db.ts:648-650`).
7. **Monolithic Bundle & Full Database Downloads (HIGH):** The initial JavaScript bundle is 1,365 kB (uncompressed) with zero route-level code splitting (`src/App.tsx:3-21`). Public page visits invoke `loadFirestoreState()`, which executes full collection scans downloading all events, tickets, orders, and user profiles into client memory, leading to severe latency and unsustainable Firebase read costs (`src/lib/firebase/firestore.ts:62-165`).

---

## 2. Architecture & System Structure

### 2.1 Framework Drift: Vite SPA vs Obsolete Next.js Specifications

#### 2.1.1 Root Observation & Code Evidence
The workspace documentation and test harness are severely desynchronized from the actual production implementation.
- `PROJECT.md` line 4 claims:
  > Framework & Runtime: Next.js 16.2.9 (App Router) + React 19.2.8 + TypeScript 5.9.3 + Tailwind CSS 4.3.1.
- `PROJECT.md` lines 104-105 references non-existent files:
  > `src/app/layout.tsx` — Root HTML layout with light theme attributes  
  > `src/app/page.tsx` — Main application shell and portal router
- `TEST_INFRA.md` lines 10-25 documents the test harness executing against `./src/app/api/v1/**/route.ts`.

In reality, the project has zero Next.js runtime dependencies (`package.json:24-34`). The application is a client-side Vite Single-Page Application:
- Entry point: `index.html` mounting `src/main.tsx` into `<div id="root">`.
- Routing: `src/App.tsx` lines 57-89 configuring React Router v7 (`<BrowserRouter>`, `<Routes>`, `<Route>`) across 18 distinct page routes.
- Polyfill Layer: `src/lib/http.ts` lines 1-25 contains stub classes for `NextRequest` and `NextResponse` created to keep server middleware compatible after Next.js was removed.
- Next.js Residuals: Over 52 source files across `src/components/` and `src/pages/` contain obsolete `"use client";` directives. During `vite build`, Rollup emits dozens of warnings:
  ```
  Module level directives cause errors when bundled, "use client" in "src/components/ui/Toast.tsx" was ignored.
  Error when using sourcemap for reporting an error: Can't resolve original location of error.
  ```

#### 2.1.2 Architectural Impact
1. **Developer Friction:** New engineers reading `PROJECT.md` attempt to build or run Next.js App Router patterns that fail immediately.
2. **Broken E2E Harness:** Automated test suites attempting to dynamically import Next.js route handlers fail on line 120 of `tests/e2e/harness.ts`.
3. **Build Noise & Sourcemap Degradation:** The `"use client"` directives pollute build outputs and prevent accurate sourcemap generation for production error monitoring.

#### 2.1.3 Concrete Remediation
1. Update `PROJECT.md` and `TEST_INFRA.md` to accurately document the Vite 6 + React 19 + React Router v7 SPA architecture.
2. Run an automated codemod across `src/` to strip all `"use client";` directives.
3. Remove unused `src/lib/http.ts` Next.js polyfills once API middleware routing is standardized.

---

### 2.2 Production Static Deployment vs Dev Server API Middleware Disparity

#### 2.2.1 Root Observation & Code Evidence
The platform operates on two completely divergent architectural pathways between local development and production hosting:

```
[Local Development Environment]
  Browser Client ──► HTTP /api/v1/* ──► Vite Connect Middleware (src/server/api-middleware.ts)
                                                   │
                                                   ▼
                                         data/aayojon-db.json (fs.readFileSync / writeFileSync)

[Production Static Hosting (Firebase / Vercel)]
  Browser Client ──► HTTP /api/v1/* ──► 404 / Rewritten to index.html (SPA Fallback)
         │
         ├──► Cloud Firestore SDK (Direct Client-Side Read/Write)
         └──► Fallback to createInitialSeed()
```

- In `vite.config.ts` line 29, `aayojonApiPlugin()` registers `src/server/api-middleware.ts` as Connect middleware. It handles 14 route patterns reading/writing to `data/aayojon-db.json` via Node `fs`.
- In production static hosting:
  - `vercel.json` lines 3-8: `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}`.
  - `firebase.json` lines 9-14: `{"rewrites": [{"source": "**", "destination": "/index.html"}]}`.
  Neither hosting platform executes Node.js runtime code in these configurations. Any HTTP call to `/api/v1/*` returns the static `index.html` text stream rather than JSON.
- To bypass this limitation, `src/lib/client-api.ts` lines 44-71 implements a complex fallback gateway:
  ```typescript
  // 1. Try Firebase Cloud Firestore first (live DB)
  try {
    const firestoreState = await loadFirestoreState();
    if (firestoreState && firestoreState.events && firestoreState.events.length > 0) {
      cachedDb = firestoreState;
    }
  } catch (err) { ... }
  // 2. Try Local API Middleware if running and firestore didn't populate
  if (!cachedDb) {
    try {
      const res = await fetch("/api/v1/state");
      if (res.ok) cachedDb = await res.json();
    } catch { ... }
  }
  // 3. Fallback to Initial Seed State
  if (!cachedDb) {
    cachedDb = createInitialSeed();
  }
  ```
- For state mutations (`dispatchStateAction`, lines 113-432), the client sends an optimistic POST to `/api/v1/state` (which silently fails with network errors in production), and then directly issues Firestore client SDK writes (`saveEventToFirestore`, `saveOrderToFirestore`, `saveTicketToFirestore`).

#### 2.2.2 Architectural Impact
- **Security Breakdown:** Because mutations are executed directly from the browser SDK without an intermediary trusted server, Firestore security rules were relaxed to allow arbitrary authenticated users to write directly to `/tickets`, `/orders`, and `/ticket_types`.
- **State Inconsistency:** If a client has network latency or browser tab crashes mid-dispatch, partial writes occur in Firestore with zero transaction or rollback guarantees.
- **Dual Maintenance Burden:** Business logic, validation, and fee calculations are implemented twice: once in `src/server/api-middleware.ts` and again in `src/lib/client-api.ts`.

#### 2.2.3 Concrete Remediation
1. Extract the business logic from `src/server/api-middleware.ts` and `src/lib/db.ts` into a unified service layer.
2. Package the API handlers into a serverless Cloud Functions backend (`functions/src/api.ts`) deployable to Firebase Functions or Vercel Serverless Functions.
3. Configure `firebase.json` and `vercel.json` rewrites to route `/api/v1/**` to the serverless function, eliminating direct client writes to financial collections.

---

### 2.3 Component Architecture & Monoliths

#### 2.3.1 Mega-Component Analysis
The frontend features excessive component consolidation. A small number of enormous files manage entire application domains, mixing data fetching, complex state machines, form validation, and rendering:

1. `src/components/OrganizerWorkspaceView.tsx`: **2,610 lines (121 KB)**
   - Manages event wizard creation, attendee rosters, CSV export, bKash/Nagad package upgrades, RFQ browsing, DNS checks, analytics, and messaging in a single function body.
   - Contains **32 distinct `useState` declarations** and 8 `useEffect` hooks. Any state mutation (e.g. typing a character in a search filter) triggers a full re-evaluation of the 2,610-line component tree.
2. `src/components/MarketplaceView.tsx`: **1,081 lines (48 KB)**
   - Completely dead, orphaned code. A grep search confirms it is never imported anywhere in `src/`. `HomePage.tsx` and `EventsPage.tsx` use modular components in `src/components/marketplace/`.
3. `src/components/event/CheckoutFlow.tsx`: **1,022 lines (44 KB)**
   - Manages ticket selection, attendee registration inputs, promo code validation, MFS gateway simulations, and QR rendering.
4. `src/components/provider/ProviderWorkspaceView.tsx`: **911 lines (39 KB)**
   - Combines service catalog management, quotation drafting, customer messaging, and booking calendars.

#### 2.3.2 Orphaned Modular Components & Redundant Shims
In `src/components/organizer/`, modular subcomponents were authored but never integrated:
- `CreateEventWizard.tsx` (303 lines) — orphaned; unreferenced in `src/`.
- `EventTable.tsx` (149 lines) — orphaned; unreferenced in `src/`.
- `src/components/layout/DesktopNavigation.tsx` (190 lines) — orphaned; never imported.
- `src/components/layout/NavigationDropdown.tsx` (48 lines) — orphaned; never imported.
- `src/components/layout/DashboardShell.tsx` (76 lines) — orphaned; never imported.

Furthermore, several components exist purely as redundant, single-line pass-through wrappers:
- `src/components/AttendeeWalletView.tsx` (merely imports and renders `AttendeeWallet.tsx`).
- `src/components/AdminConsoleView.tsx` (merely imports and renders `AdminConsole.tsx`).
- `src/components/CheckInScannerView.tsx` (merely imports and renders `CheckInScanner.tsx`).
- `src/components/SponsorMarketplaceView.tsx` (merely imports and renders `SponsorMarketplace.tsx`).

#### 2.3.3 Concrete Remediation
1. Decompose `OrganizerWorkspaceView.tsx` into isolated subcomponents:
   - `OrganizerKpis.tsx` (Dashboard metrics and charts)
   - `OrganizerEventList.tsx` (integrating orphaned `EventTable.tsx`)
   - `OrganizerEventWizard.tsx` (integrating orphaned `CreateEventWizard.tsx`)
   - `OrganizerAttendeeRoster.tsx` (Attendee list, badge printing, and CSV export)
   - `OrganizerPackageUpgrade.tsx` (bKash/Nagad billing modal)
2. Delete `src/components/MarketplaceView.tsx` (1,081 lines of dead code).
3. Eliminate redundant `*View.tsx` shims and import canonical components directly into page routes.
4. Prune unused layout components in `src/components/layout/`.

---

### 2.4 Modularity & Bundle Optimization

#### 2.4.1 Production Bundle Metrics
Executing `npm run build` produces the following asset distribution:
```
dist/index.html                     1.09 kB │ gzip:   0.66 kB
dist/assets/index-CJraSy5N.css    122.11 kB │ gzip:  16.89 kB
dist/assets/index-Dx-p2dLb.js   1,365.24 kB │ gzip: 337.09 kB
```
Vite emits an explicit warning during bundling:
`(!) Some chunks are larger than 500 kB after minification.`

#### 2.4.2 Root Causes of Bundle Bloat
1. **Zero Route-Level Code Splitting:** In `src/App.tsx` lines 3-21, all 18 routes (`HomePage`, `EventsPage`, `SuperAdminConsolePage`, `OrganizerWorkspacePage`, `CheckInScannerPage`, `CheckoutPage`, `ProviderWorkspacePage`, etc.) are imported statically:
   ```typescript
   import HomePage from "./pages/HomePage";
   import EventsPage from "./pages/EventsPage";
   import SuperAdminConsolePage from "./pages/SuperAdminConsolePage";
   import OrganizerWorkspacePage from "./pages/OrganizerWorkspacePage";
   ...
   ```
   A first-time public visitor landing on the homepage downloads the entire administrative console, QR scanner engines, provider dashboards, and PDF/CSV export libraries.
2. **Missing Vite React Plugin:** In `vite.config.ts`, `plugins: [aayojonApiPlugin()]` is declared without `@vitejs/plugin-react` (even though `"@vitejs/plugin-react": "^4.7.0"` is present in `package.json`). As a result, React Fast Refresh and standard Rollup chunk optimization for React are absent.
3. **Unused Heavy Dependencies:** `package.json` line 21 includes `"motion": "^14.12.0"`. A full codebase search confirms zero imports of `motion` or `framer-motion` (the codebase exclusively uses CSS classes and Tailwind transitions).
4. **Redundant Font Loading Waterfall:**
   - `package.json` lines 17-18 installs `@fontsource-variable/inter` and `@fontsource/hind-siliguri`.
   - `index.html` lines 8-10 adds external Google Fonts `<link>` stylesheet tags.
   - `src/styles/brand.css` line 1 contains `@import url('https://fonts.googleapis.com/css2?...')`.
   Fonts are fetched through three separate pathways, stalling initial paint with external network requests while locally installed font packages remain unused.

#### 2.4.3 Optimization Blueprint & Projected Savings
1. **Dynamic Route Splitting:** Convert all 18 static page imports in `src/App.tsx` to `React.lazy()` with `<Suspense fallback={<LoadingSpinner />}>`:
   ```typescript
   const HomePage = React.lazy(() => import("./pages/HomePage"));
   const SuperAdminConsolePage = React.lazy(() => import("./pages/SuperAdminConsolePage"));
   const OrganizerWorkspacePage = React.lazy(() => import("./pages/OrganizerWorkspacePage"));
   ```
2. **Manual Chunking in `vite.config.ts`:**
   ```typescript
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           vendor: ["react", "react-dom", "react-router-dom"],
           firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
           icons: ["lucide-react"]
         }
       }
     }
   }
   ```
3. **Projected Result:**
   - Initial entry bundle: **~210 kB (gzip: ~65 kB)** — a **>70% reduction in initial payload**.
   - Admin and Organizer chunks isolated and loaded only upon role-authorized navigation.

---

## 3. Code Quality, Security, Data Integrity & Maintainability

### 3.1 Critical Security Vulnerabilities & Authorization Flaws

#### 3.1.1 Vulnerability SEC-001: Firestore Security Rules Privilege Escalation
- **Affected File:** `firestore.rules` (lines 25-36, 86-88)
- **Vulnerability Type:** CWE-269: Improper Privilege Management
- **Severity:** **CRITICAL (CVSS 9.8)**
- **Technical Analysis:**
  In `firestore.rules`, administrative access is granted if `getUserData().platform_role == 'ADMIN'`:
  ```javascript
  function isAdmin() {
    return isAuthenticated() && (
      request.auth.token.role == 'admin' ||
      request.auth.token.role == 'super_admin' ||
      getUserData().platform_role == 'ADMIN' ||
      getUserData().platform_role == 'SUPER_ADMIN' ||
      request.auth.token.email == 'bfos.info@gmail.com'
    );
  }
  ```
  However, lines 86-88 govern user profiles:
  ```javascript
  match /profiles/{userId} {
    allow read: if true;
    allow create, update: if (isUser(userId) || isAdmin()) && isNotSuspended();
    allow delete: if isAdmin();
  }
  ```
  When an authenticated user updates their own profile (`isUser(userId)` evaluates to `true`), the rule enforces no field-level schema validation. Any regular user can execute:
  ```javascript
  await updateDoc(doc(db, "profiles", auth.currentUser.uid), {
    platform_role: "ADMIN"
  });
  ```
  Immediately following this write, `getUserData().platform_role == 'ADMIN'` becomes true. The user acquires unrestricted admin rights, enabling them to read and delete any document across the database.
- **Remediation:**
  In `firestore.rules`, disallow updating the `platform_role` field unless the caller is already a verified admin via custom claims (`request.auth.token.admin == true`):
  ```javascript
  allow update: if isUser(userId) && isNotSuspended() &&
    (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['platform_role', 'role', 'is_suspended']));
  ```

---

#### 3.1.2 Vulnerability SEC-002: Public Read/Write Access to Tickets and Orders
- **Affected File:** `firestore.rules` (lines 140-160)
- **Vulnerability Type:** CWE-639: Insecure Direct Object References (IDOR)
- **Severity:** **CRITICAL (CVSS 9.1)**
- **Technical Analysis:**
  The rules governing orders, tickets, and registrations permit any authenticated user to read and mutate every record in the collection:
  ```javascript
  match /orders/{orderId} {
    allow read: if isAuthenticated();
    allow create, update: if isAuthenticated() && isNotSuspended();
  }
  match /tickets/{ticketId} {
    allow read: if isAuthenticated();
    allow create, update: if isAuthenticated() && isNotSuspended();
  }
  ```
  - **Data Leakage:** Any attendee can query the entire `/tickets` collection, extracting full names, emails, and raw `qr_token` secrets for all attendees.
  - **Ticket Counterfeiting:** An attendee can forge valid ticket documents with status `VALID` for any sold-out event directly via the client SDK without submitting payment.
- **Remediation:**
  Restrict reads to resource owners (`resource.data.user_id == request.auth.uid`), event organizers, and platform administrators. Prohibit direct client ticket creations and updates entirely; ticket minting must be handled exclusively by trusted serverless webhooks upon payment confirmation.

---

#### 3.1.3 Vulnerability SEC-003: Hardcoded Third-Party Superadmin Email Backdoor
- **Affected Files:** `firestore.rules` (line 35), `src/lib/permissions/rbac.ts` (lines 285-288)
- **Vulnerability Type:** CWE-798: Use of Hard-coded Credentials
- **Severity:** **HIGH (CVSS 8.2)**
- **Technical Analysis:**
  A personal Gmail address is hardcoded as an absolute superadmin in both security rules and RBAC authorization logic:
  ```javascript
  // firestore.rules:35
  request.auth.token.email == 'bfos.info@gmail.com'
  ```
  ```typescript
  // src/lib/permissions/rbac.ts:285-288
  if (user.email === "bfos.info@gmail.com" || user.email?.endsWith("@ayojon.select")) {
    return { granted: true, role: "SUPER_ADMIN" };
  }
  ```
  If that third-party email account is compromised, the attacker automatically inherits root privileges over all events, customer PII, and financial ledgers.
- **Remediation:**
  Remove `bfos.info@gmail.com` immediately. Superadmin privileges must be granted strictly via Firebase Auth Custom Claims managed through secure backend scripts.

---

#### 3.1.4 Vulnerability SEC-004: Default Superadmin Fallback in Dev API Middleware
- **Affected File:** `src/server/api-middleware.ts` (lines 62-64, 117)
- **Vulnerability Type:** CWE-306: Missing Authentication for Critical Function
- **Severity:** **HIGH (CVSS 8.5)**
- **Technical Analysis:**
  In `src/server/api-middleware.ts`:
  ```typescript
  const db = loadDb();
  const actorUserId = (req.headers["x-actor-user-id"] as string) || "usr-superadmin";
  ```
  Any HTTP request to `/api/v1/*` omitting the `x-actor-user-id` header is automatically assigned `usr-superadmin` identity. Furthermore, supplying an arbitrary string in `x-actor-user-id` grants the caller the identity of any user in the system without validating passwords, sessions, or cryptographic tokens.
- **Remediation:**
  Require valid Bearer token authentication via `verifyAuthToken`. If `req.headers.authorization` is missing or invalid, reject immediately with HTTP 401 Unauthorized.

---

#### 3.1.5 Vulnerability SEC-005: Unverified Mock Token JWT Acceptance
- **Affected File:** `src/lib/firebase/auth-middleware.ts` (lines 149-238, 256-300)
- **Vulnerability Type:** CWE-347: Improper Verification of Cryptographic Signature
- **Severity:** **HIGH (CVSS 8.6)**
- **Technical Analysis:**
  The token validation logic accepts mock tokens and unsigned JWTs without verifying cryptographic signatures against Google/Firebase public certificates:
  ```typescript
  // Lines 213-238: Unauthenticated mock string grants admin role
  if (token.startsWith("mock-firebase-token:")) {
    const [, uid, role, email] = token.split(":");
    return { uid, role: role || "attendee", email };
  }
  // Lines 256-300: 3-part JWT accepted by decoding base64 payload without signature validation
  ```
  This vulnerability was empirically demonstrated by running `tests/stress-test.ts`:
  ```
  [A2] FINDING [HIGH]: Forged mock-firebase-token granted unauthenticated caller admin role: { uid: 'attacker-hacker', email: 'attacker@evil.com', role: 'admin' }
  [A3] FINDING [HIGH]: Unsigned mock-jwt with forged signature granted admin role: { uid: 'attacker-jwt', role: 'admin' }
  ```
- **Remediation:**
  Isolate mock token handlers strictly behind `process.env.NODE_ENV === "test"`. In all non-test environments, verify JWT signatures using Firebase Admin SDK or Google OAuth public JWKS endpoints.

---

#### 3.1.6 Vulnerability SEC-006: Route Guard Timing Leak in Admin Console
- **Affected File:** `src/pages/SuperAdminConsolePage.tsx` (lines 85-107, 170)
- **Vulnerability Type:** CWE-200: Exposure of Sensitive Information
- **Severity:** **MEDIUM (CVSS 6.5)**
- **Technical Analysis:**
  In `SuperAdminConsolePage.tsx`, `fetchDatabaseState()` executes unconditionally inside `useEffect` on component mount, fetching confidential database state (audit logs, user lists, roles).
  Line 170 wraps only the returned JSX in `<ProtectedRoute allowedRoles={["admin", "super_admin"]}>`. An unprivileged user navigating to `/admin` triggers the network fetch before `ProtectedRoute` renders `AccessDeniedView`. Sensitive state is captured in browser memory, network inspectors, and React DevTools.
- **Remediation:**
  Move route protection up to the router level in `src/App.tsx`, preventing unauthorized components from mounting or initiating data fetches.

---

#### 3.1.7 Vulnerability SEC-007: Hardcoded Secrets & Production Configs in Source Code
- **Affected Files:** `src/lib/db.ts` (line 20), `src/lib/firebase/config.ts` (lines 33-41), `vite.config.ts` (lines 8-14)
- **Vulnerability Type:** CWE-798: Hard-coded Credentials
- **Severity:** **MEDIUM (CVSS 5.3)**
- **Technical Analysis:**
  - `src/lib/db.ts:20` exposes:
    `export const WEBHOOK_SECRET = "whsec_aayojon_bd_live_hmac_2026_secret";`
  - `src/lib/firebase/config.ts:33-41` hardcodes live Firebase API credentials and project IDs directly in client code.
- **Remediation:**
  Migrate all secrets to environment variables (`.env`) accessed via `process.env` (server) or `import.meta.env.VITE_*` (client). Add `.env` to `.gitignore`.

---

### 3.2 Schema Divergence & Data Integrity Bugs

#### 3.2.1 Bug DATA-001: Client Ticket Registration Schema Divergence
- **Affected Files:** `src/lib/client-api.ts` (lines 261-274, 316-329), `src/lib/types.ts` (lines 250-262), `src/server/api-middleware.ts` (line 464), `src/lib/db.ts` (line 1011)
- **Severity:** **CRITICAL FUNCTIONAL DEFECT**
- **Root Cause & Code Mismatch:**
  In `src/lib/types.ts`, `TicketRecord` is defined as:
  ```typescript
  export interface TicketRecord {
    id: string;
    event_id: string;              // REQUIRED
    ticket_type_id: string;        // REQUIRED
    registration_id: string;       // REQUIRED
    attendee_user_id?: string;
    attendee_name: string;         // REQUIRED
    attendee_email: string;        // REQUIRED
    ticket_type_name: string;      // REQUIRED
    qr_token: string;              // REQUIRED
    token_hash: string;            // REQUIRED
    status: TicketStatus;          // "VALID" | "USED" | "CANCELLED" | "TRANSFERRED"
    created_at: string;
  }
  ```
  However, in `src/lib/client-api.ts` lines 268-274 (`REGISTER_FREE`) and lines 323-329 (`BUY_TICKET`), client ticket objects are created with missing properties and an invalid status:
  ```typescript
  const newTicket: any = {
    id: ticketId,
    registration_id: regId,
    qr_token: qrToken,
    status: "ISSUED", // INVALID: Not in TicketStatus enum
    created_at: new Date().toISOString(),
  };
  // Lines 261, 316: stores attendee_user_id instead of user_id on newReg
  ```
- **Consequences:**
  1. **Vanishing Tickets in Wallet:** In `src/server/api-middleware.ts:464` (`GET /api/v1/me/tickets`), tickets are filtered by:
     ```typescript
     const userTickets = db.tickets.filter((t) => {
       const reg = db.registrations.find((r) => r.id === t.registration_id);
       return (reg && reg.user_id === actorUserId) || (actor && t.attendee_email === actor.email);
     });
     ```
     Because `reg.user_id` is undefined (stored as `attendee_user_id`) and `t.attendee_email` is undefined, the ticket fails both conditions and is invisible in the user's wallet.
  2. **Gate Rejection:** At gate scanning in `src/lib/db.ts:1011`:
     ```typescript
     if (input.eventId && ticket.event_id !== input.eventId) {
       return { result: "INVALID_EVENT", message: "Ticket belongs to a different event." };
     }
     ```
     Because `ticket.event_id` was never saved, `undefined !== input.eventId` evaluates to `true`. Every client-purchased ticket is rejected at the gate with `INVALID_EVENT`.
- **Remediation:**
  Refactor `client-api.ts` to construct complete `TicketRecord` entities populated with `event_id`, `ticket_type_id`, `attendee_name`, `attendee_email`, `token_hash: hashToken(qrToken)`, and status `"VALID"`.

---

#### 3.2.2 Bug DATA-002: Gate Check-in QR Bypass via Plain Ticket ID
- **Affected File:** `src/lib/db.ts` (lines 1000-1002)
- **Severity:** **HIGH**
- **Technical Analysis:**
  `validateTicketQr` checks the following predicate:
  ```typescript
  const ticket = db.tickets.find(
    (t) => t.token_hash === hashed || t.qr_token.toLowerCase() === trimmed.toLowerCase() || t.id === trimmed
  );
  ```
  The condition `t.id === trimmed` allows gate entry by providing the plain public ticket ID (e.g. `tkt-1234abcd`). Ticket IDs appear in URL query strings, email subject lines, and invoices. An attendee who shares a screenshot of their order confirmation exposes their ticket ID, allowing an unauthorized third party to bypass the high-entropy cryptographic QR token and gain admission.
- **Remediation:**
  Remove `t.id === trimmed` from `validateTicketQr`. Gate admission must require matching `token_hash === hashed` or `qr_token === trimmed`.

---

#### 3.2.3 Bug DATA-003: Unbounded Inventory Lock & Missing Order Expiration TTL
- **Affected File:** `src/lib/db.ts` (lines 648-650, 778-787)
- **Severity:** **HIGH**
- **Technical Analysis:**
  In `createTicketOrder`:
  ```typescript
  for (const r of resolvedItems) {
    r.ticketType.sold_count += r.quantity;
  }
  ```
  Inventory is decremented immediately when an order is created with status `PENDING`. If the user abandons payment, closes the checkout tab, or loses internet connectivity, `sold_count` remains permanently elevated. There is no automated timeout, background worker, or cleanup routine to release reserved stock.
- **Remediation:**
  Implement a 15-minute reservation TTL. Store `expires_at` on pending orders. In `createTicketOrder`, compute available inventory as:
  `capacity - (paid_count + active_pending_count_where_not_expired)`.
  Add a periodic cleanup sweep or on-demand inventory reconciler to release expired pending reservations.

---

### 3.3 Disconnected State Persistence

#### 3.3.1 Triple Disconnected Storage Architecture
A major source of user confusion and state fragmentation is the coexistence of three mutually unaware persistence layers for Request for Quotations (RFQs) and venue bookings:

```
[Layer 1: LocalStorage]
  src/components/venue/RfqBuilderWizard.tsx:192-195  ──► localStorage["aayojon_custom_rfqs"]
  src/components/venue/BookingConfirmationModal.tsx:73-76 ──► localStorage["aayojon_custom_bookings"]

[Layer 2: Component Local State]
  src/components/OrganizerWorkspaceView.tsx:88-164   ──► useState(() => SEED_DATA)
  (Never reads or observes localStorage)

[Layer 3: Database & Cloud Firestore]
  src/lib/client-api.ts:121-137                      ──► /api/v1/state & Firestore collections
```

#### 3.3.2 Functional Impact
1. When a user submits an RFQ through `RfqBuilderWizard`, the inquiry is written solely to `localStorage`.
2. When the user navigates to `/organizer` to review their inquiries, `OrganizerWorkspaceView` reads exclusively from its internal `useState` initialized with static seed records. The newly submitted RFQ does not appear.
3. Vendors checking `/provider` query Firestore and also see nothing.
4. The user experiences total state disconnection across features.

#### 3.3.3 Remediation
Unify RFQ and booking submissions under `src/lib/client-api.ts` dispatch actions (`SUBMIT_VENUE_RFQ`, `CREATE_BOOKING`). Ensure all views query the unified state provider (`useAppState` / React Context) backed by Firestore / backend APIs. Eliminate isolated `localStorage` writes.

---

### 3.4 Performance & Scalability Bottlenecks

#### 3.4.1 Bottleneck PERF-001: Unbounded Full Database Downloads on Page Load
- **Affected File:** `src/lib/firebase/firestore.ts` (lines 62-165)
- **Severity:** **HIGH**
- **Technical Analysis:**
  The `loadFirestoreState` function executes full table scans across seven Firestore collections sequentially on startup:
  ```typescript
  const [events, ticketTypes, profiles, venues, categories, tickets, orders] = await Promise.all([
    getDocs(collection(fs, "events")),
    getDocs(collection(fs, "ticket_types")),
    getDocs(collection(fs, "profiles")),
    getDocs(collection(fs, "venues")),
    getDocs(collection(fs, "categories")),
    getDocs(collection(fs, "tickets")),
    getDocs(collection(fs, "orders"))
  ]);
  ```
  - **Financial Cost & Read Limits:** If the platform hosts 500 events, 2,000 ticket types, and 10,000 tickets, a single visitor landing on the homepage generates **12,500 Firestore document reads**. A modest marketing campaign with 1,000 daily visitors would generate 12.5 million reads per day ($7.50+/day under Firestore pricing, quickly exhausting free tiers and budget caps).
  - **Network Latency:** Downloading megabytes of JSON over mobile 3G/4G connections introduces multi-second Time to Interactive (TTI) delays.
- **Remediation:**
  Scope queries with Firestore constraints (`where("status", "==", "PUBLISHED")`, `limit(20)`). Implement cursor-based pagination. Move private collections (`/orders`, `/tickets`, `/profiles`) out of the public initial load entirely.

---

#### 3.4.2 Bottleneck PERF-002: Synchronous Blocking JSON File I/O
- **Affected File:** `src/lib/db.ts` (lines 62, 92-95)
- **Severity:** **MEDIUM**
- **Technical Analysis:**
  In `src/lib/db.ts`:
  ```typescript
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  ...
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  ```
  During every API mutation (ticket purchase, event creation, registration), the Node.js event loop blocks synchronously while reading and pretty-printing a 100+ KB JSON database file.
  - **Data Corruption Risk:** `fs.writeFileSync` performs non-atomic writes. If the Node process crashes or is restarted mid-write, the file is truncated, destroying database state.
  - **Silent Error Swallowing:** Line 94 contains an empty catch block:
    `catch { // Ignore write failure in read-only edge environments }`
    Disk-full conditions and permission failures fail silently without alerting administrators or returning error responses to callers.
- **Remediation:**
  Use atomic asynchronous writes (write to temporary file, followed by `fs.promises.rename`). Replace the flat JSON file with SQLite (`better-sqlite3`) for robust local development.

---

## 4. Testing Infrastructure & Verification Readiness

### 4.1 Test Suite Status: Active Suite vs Dead E2E Suite

The repository contains 13 test and runner files under `tests/`. However, there is a stark divide between active unit/in-memory tests and the dormant E2E suite:

```
+--------------------------------------------------------------------------------+
|                         TEST INFRASTRUCTURE BREAKDOWN                          |
+------------------------------------+-----------+---------+---------------------+
| Test Suite Category                | Tests     | Lines   | Execution Status    |
+------------------------------------+-----------+---------+---------------------+
| Active Invariant & QA Suites       | 92 tests  | 2,376   | ✅ 100% PASS (3.8s) |
| Dead 4-Tier E2E Test Suite         | 230 tests | 4,086   | ❌ SILENTLY SKIPPED |
| Empirical Stress Test Suite        | 12 tests  | 352     | ❌ UNHANDLED CRASH  |
+------------------------------------+-----------+---------+---------------------+
| TOTAL INVENTORY                    | 334 tests | 6,814   | 28% ACTIVE / 72% DEAD
+------------------------------------+-----------+---------+---------------------+
```

#### 4.1.1 The Active Suite (92 Passing Tests)
Executing `npm test` compiles TypeScript files to `.test-dist/` and runs `tests/test-runner.ts`. All 92 tests pass consistently:
- `tests/qa-suite.test.ts` (14/14 tests pass): Core business rules (draft preservation, package upgrades, webhook idempotency, scan deduplication).
- `tests/firebase-auth.test.ts` (8/8 tests pass): Auth provider, credentials, role mapping, persona switching.
- `tests/marketplace-rfq.test.ts` (8/8 tests pass): Venue specs, multi-step RFQ math, quote revisions, AI budget synthesis.
- `tests/rbac.test.ts` (15/15 tests pass): Cross-tenant isolation, role checks, staff event boundaries.
- `tests/persona-behavioral-matrix.test.ts` (47/47 tests pass): Guest, Attendee, Organizer, Gate Staff, and UIX behavior.

#### 4.1.2 The Dead E2E Suite (230 Silently Skipped Tests)
`TEST_INFRA.md` claims 230 comprehensive E2E tests are executed via `tests/e2e/runner.ts`.
Executing `node ./node_modules/.bin/jiti tests/e2e/runner.ts` outputs:
```
==============================================================
          AAYOJON COMPREHENSIVE 4-TIER E2E TEST RUNNER        
==============================================================

No tests matched the requested filters.
```
The runner exits with code 0 without executing any tests.

**Root Cause Analysis:**
1. In `tests/e2e/harness.ts` lines 118-135, the harness attempts to dynamically import 14 Next.js App Router route handlers:
   ```typescript
   const routes = {
     events: jiti("./src/app/api/v1/events/route.ts"),
     eventSlug: jiti("./src/app/api/v1/events/[slugOrId]/route.ts"),
     orders: jiti("./src/app/api/v1/orders/route.ts"),
     ticketValidate: jiti("./src/app/api/v1/tickets/validate/route.ts"),
     ...
   };
   ```
   Because `./src/app/` does not exist in the Vite architecture, `jiti` throws `Error: Cannot find module './src/app/api/v1/events/route.ts'`.
2. In `tests/e2e/runner.ts` lines 141-146, the suite loader wraps test imports in empty catch blocks:
   ```typescript
   try { jiti("./tests/e2e/tier1-features.test.ts"); } catch (e) { /* Pending creation */ }
   try { jiti("./tests/e2e/tier2-boundary.test.ts"); } catch (e) { /* Pending creation */ }
   try { jiti("./tests/e2e/tier3-combinations.test.ts"); } catch (e) { /* Pending creation */ }
   try { jiti("./tests/e2e/tier4-scenarios.test.ts"); } catch (e) { /* Pending creation */ }
   ```
   When `tier1-features.test.ts` imports `harness.ts`, `harness.ts` fails, and `runner.ts` silently swallows the error. The test registry remains completely empty, leading the runner to report zero matching tests and exit cleanly.
3. Over **4,086 lines of rich end-to-end tests** are completely unexecuted:
   - Tier 1 Features: 100 tests (`tier1-features.test.ts`)
   - Tier 2 Boundaries: 100 tests (`tier2-boundary.test.ts`)
   - Tier 3 Combinations: 20 tests (`tier3-combinations.test.ts`)
   - Tier 4 Scenarios: 10 tests (`tier4-scenarios.test.ts`)

---

### 4.2 Stress Test Suite Unhandled Rejection Crash

Running `tests/stress-test.ts` fails with an unhandled exception in Area C:
```
--- [Area A] Malformed, Corrupt & Forged Bearer Tokens ---
  [A1] PASS: Corrupt base64 payload rejected with 401 UNAUTHENTICATED
  [A2] FINDING [HIGH]: Forged mock-firebase-token granted unauthenticated caller admin role
  [A3] FINDING [HIGH]: Unsigned mock-jwt with forged signature granted admin role

--- [Area B] Expired Mock JWT Tokens ---
  [B1] PASS: Explicit 'expired-token' rejected with 401
  [B2] PASS: createExpiredMockToken rejected with 'Token has expired'

--- [Area C] Tampered Payload Tokens ---
Empirical suite failed to execute: DomainError: Invalid or missing user ID in token payload
    at verifyAuthToken (/Users/sameulhasan/Documents/Experiment/.test-dist/src/lib/firebase/auth-middleware.js:119:19)
    at runEmpiricalSuite (/Users/sameulhasan/Documents/Experiment/.test-dist/tests/stress-test.js:138:64)
```

**Root Cause:**
In `tests/stress-test.ts` line 178:
```typescript
const c1User = await verifyAuthToken("mock-jwt." + c1B64 + ".sig");
```
When `verifyAuthToken` was hardened in `src/lib/firebase/auth-middleware.ts` to reject payloads lacking a `uid`, it threw a `DomainError`. Because line 178 lacks a `try...catch` block or `assert.rejects`, the unhandled promise rejection crashes the Node process, leaving the remainder of the stress suite unexecuted.

---

### 4.3 Testing Blind Spots & Infrastructure Deficits

1. **Zero Frontend UI / DOM Component Tests:**
   The application contains 18 pages in `src/pages/` and 20+ components in `src/components/`, including massive user interfaces (`OrganizerWorkspaceView`, `CheckoutFlow`, `SuperAdminConsolePage`). There are **zero `.test.tsx` or `.spec.tsx` files** anywhere in the workspace. No DOM testing library (`@testing-library/react`, `jsdom`, or `happy-dom`) is installed. React hook errors, rendering exceptions, or broken navigation cannot be detected automatically.
2. **Zero CI/CD Automation:**
   The workspace has no CI/CD configuration. The directory `.github/workflows` does not exist. Pull requests and commits can introduce regressions without triggering automated verification.
3. **No Declarative Firestore Rules Unit Testing:**
   `firestore.rules` contains 231 lines of critical security logic. There are zero unit tests validating these rules. `@firebase/rules-unit-testing` is not installed, and `firebase.json` has no emulator configuration.
4. **Transitive Tooling Hazard:**
   `tests/e2e/runner.ts` relies on `jiti`, but `jiti` is not declared in `package.json` `devDependencies` (it is present only as a transitive dependency). A clean install with `npm ci` in a fresh environment risks execution failure.
5. **No Code Coverage Enforcement:**
   No coverage tool (`c8`, `@vitest/coverage-v8`, or `istanbul`) is configured. Code coverage metrics cannot be tracked or enforced.

---

## 5. Prioritized Action Matrix

The following matrix organizes all identified improvements across seven engineering domains. Every recommendation is scored by Impact, Effort, and Priority.

| ID | Domain | Recommendation Title & Scope | Impact | Effort | Priority | Exact Files Cited |
|:---|:---|:---|:---:|:---:|:---:|:---|
| **SEC-001** | Security | **Fix Firestore Rules Privilege Escalation**<br>Prevent users from updating their own `platform_role` to `ADMIN` or `SUPER_ADMIN`. Enforce field immutability in `firestore.rules`. | **HIGH** | **LOW** | **P0** | `firestore.rules:25-36, 86-88` |
| **SEC-002** | Security | **Lock Down Orders, Tickets & Registrations Collections**<br>Restrict Firestore reads to resource owners and verified staff. Prohibit direct client writes to financial records. | **HIGH** | **MEDIUM** | **P0** | `firestore.rules:140-160` |
| **SEC-003** | Security | **Eliminate Public Ticket ID Gate Validation Bypass**<br>Remove `t.id === trimmed` fallback from `validateTicketQr`. Require valid cryptographic QR hash verification. | **HIGH** | **LOW** | **P0** | `src/lib/db.ts:1000-1002` |
| **DATA-001**| Bugfix | **Fix Client Ticket Registration Schema Divergence**<br>Populate `event_id`, `ticket_type_id`, `attendee_name`, `attendee_email`, `token_hash`, and status `"VALID"` on client ticket creation. | **HIGH** | **LOW** | **P0** | `src/lib/client-api.ts:261-274, 316-329`<br>`src/server/api-middleware.ts:464`<br>`src/lib/db.ts:1011` |
| **SEC-004** | Security | **Disable Default Superadmin in API Middleware**<br>Reject requests lacking authentication with 401 Unauthorized instead of defaulting to `usr-superadmin`. Validate `x-actor-user-id`. | **HIGH** | **LOW** | **P0** | `src/server/api-middleware.ts:62-64, 117` |
| **SEC-005** | Security | **Remove Hardcoded Gmail Superadmin Backdoor**<br>Remove `bfos.info@gmail.com` from `firestore.rules` and `rbac.ts`. Restrict admin roles to verified custom claims. | **HIGH** | **LOW** | **P1** | `firestore.rules:35`<br>`src/lib/permissions/rbac.ts:285-288` |
| **TEST-001**| Testing | **Resuscitate 230-Test E2E Test Suite in `harness.ts`**<br>Adapt `harness.ts` to dispatch requests through active API middleware or local HTTP server instead of missing Next.js routes. | **HIGH** | **MEDIUM** | **P1** | `tests/e2e/harness.ts:118-135`<br>`tests/e2e/runner.ts:141-146` |
| **TEST-002**| Testing | **Remove Silent Error Masking in `runner.ts`**<br>Eliminate empty catch blocks around test imports so suite failures surface explicitly instead of falsely reporting 0 tests. | **HIGH** | **LOW** | **P1** | `tests/e2e/runner.ts:141-146` |
| **TEST-003**| Testing | **Fix Stress Test Suite Unhandled Rejection Crash**<br>Wrap `verifyAuthToken` call on line 178 in `assert.rejects` or `try...catch` handling `DomainError`. | **HIGH** | **LOW** | **P1** | `tests/stress-test.ts:178-180` |
| **DATA-002**| Reliability | **Implement Order Reservation TTL & Expiration Sweep**<br>Add 15-minute reservation timer on pending orders to automatically release held capacity if checkout is abandoned. | **HIGH** | **MEDIUM** | **P1** | `src/lib/db.ts:648-650, 778-787` |
| **SEC-006** | Security | **Implement Cryptographic JWT Verification**<br>Validate Firebase token signatures against Google public keys. Restrict mock token bypass strictly to test environments. | **HIGH** | **MEDIUM** | **P1** | `src/lib/firebase/auth-middleware.ts:149-300` |
| **TEST-004**| Tooling | **Establish GitHub Actions CI/CD Pipeline**<br>Author `.github/workflows/ci.yml` running linting, build, `npm test`, and E2E test suites on push and PR. | **HIGH** | **MEDIUM** | **P1** | `.github/workflows/ci.yml`<br>`package.json` |
| **DOC-001** | Architecture | **Synchronize Architectural Documentation with Vite**<br>Update `PROJECT.md` and `TEST_INFRA.md` to reflect the Vite 6 SPA reality, removing obsolete Next.js references. | **HIGH** | **LOW** | **P1** | `PROJECT.md:4-10, 104-105`<br>`TEST_INFRA.md:10-30` |
| **ARCH-001**| Architecture | **Unify Disconnected RFQ and Booking Persistence**<br>Eliminate isolated `localStorage` in wizards and unify RFQ/booking creation under shared client API dispatch actions. | **HIGH** | **MEDIUM** | **P1** | `src/components/venue/RfqBuilderWizard.tsx:192-195`<br>`src/components/venue/BookingConfirmationModal.tsx:73-76`<br>`src/components/OrganizerWorkspaceView.tsx:88-164` |
| **PERF-001**| Performance | **Implement Route-Level Code Splitting (`React.lazy`)**<br>Lazy-load all 18 routes in `src/App.tsx` with `Suspense` fallbacks to reduce initial JS payload by >70%. | **HIGH** | **MEDIUM** | **P2** | `src/App.tsx:3-21, 57-89`<br>`vite.config.ts` |
| **PERF-002**| Performance | **Scope Firestore Queries & Add Pagination**<br>Replace full-collection scans in `loadFirestoreState` with filtered queries (`where("status", "==", "PUBLISHED")`) and limits. | **HIGH** | **MEDIUM** | **P2** | `src/lib/firebase/firestore.ts:62-165` |
| **ARCH-002**| Modularity | **Decompose `OrganizerWorkspaceView.tsx` (2,610 lines)**<br>Break monolithic component into `OrganizerKpis`, `EventTable`, `CreateEventWizard`, and `AttendeeRoster`. | **MEDIUM** | **MEDIUM** | **P2** | `src/components/OrganizerWorkspaceView.tsx`<br>`src/components/organizer/*` |
| **PERF-003**| Reliability | **Replace Synchronous Blocking JSON File I/O**<br>Replace `fs.readFileSync` and `fs.writeFileSync` in `db.ts` with atomic asynchronous file writes or SQLite. | **MEDIUM** | **MEDIUM** | **P2** | `src/lib/db.ts:62, 92-95` |
| **SEC-007** | Security | **Enforce Route Guards at Router Level in `App.tsx`**<br>Wrap protected routes in `App.tsx` with `<ProtectedRoute>` to prevent unauthorized components from initiating data fetches. | **MEDIUM** | **LOW** | **P2** | `src/App.tsx:69-76`<br>`src/pages/SuperAdminConsolePage.tsx:85-107, 170` |
| **SEC-008** | Security | **Externalize Secrets to Environment Variables**<br>Move `WEBHOOK_SECRET` and Firebase configs out of source code into `.env` files. | **MEDIUM** | **LOW** | **P2** | `src/lib/db.ts:20`<br>`src/lib/firebase/config.ts:33-41`<br>`vite.config.ts:8-14` |
| **TOOL-001**| Tooling | **Declare Missing Dependencies & Scripts in `package.json`**<br>Add `"jiti"`, `"tsx"` to `devDependencies`. Add `"test:e2e"` script to `scripts`. | **MEDIUM** | **LOW** | **P2** | `package.json:6-15, 26-35` |
| **TEST-005**| Testing | **Add Declarative Firestore Security Rules Unit Tests**<br>Configure `@firebase/rules-unit-testing` and Firebase Local Emulator to verify rule enforcement in CI. | **HIGH** | **MEDIUM** | **P2** | `firestore.rules`<br>`firebase.json` |
| **CLEAN-001**| Maintainability| **Purge Dead Code (`MarketplaceView.tsx`, `supabase/`)**<br>Delete unreferenced 1,081-line `MarketplaceView.tsx`, orphaned Supabase SQL migrations, and obsolete shims. | **MEDIUM** | **LOW** | **P3** | `src/components/MarketplaceView.tsx`<br>`supabase/` |
| **CLEAN-002**| Code Health | **Strip Obsolete Next.js `"use client"` Directives**<br>Remove `"use client";` across 52 source files to eliminate Rollup build warnings and fix sourcemaps. | **LOW** | **LOW** | **P3** | 52 source files across `src/` |
| **TEST-006**| Testing | **Introduce Frontend Component Tests (`@testing-library/react`)**<br>Add component tests for critical user journeys: Checkout flow, QR rendering, and gate scanner simulation. | **HIGH** | **HIGH** | **P3** | `src/components/event/*`<br>`src/components/attendee/*` |
| **TOOL-002**| Tooling | **Configure `@vitejs/plugin-react` in Vite Configuration**<br>Mount `@vitejs/plugin-react` in `vite.config.ts` to restore Fast Refresh and standard JSX compilation. | **MEDIUM** | **LOW** | **P3** | `vite.config.ts:1-44`<br>`package.json:31` |
| **PERF-004**| Performance | **Consolidate Font Loading via `@fontsource`**<br>Remove external Google Fonts `<link>` and `@import` tags; use locally installed `@fontsource` npm packages. | **LOW** | **LOW** | **P3** | `index.html:8-10`<br>`src/styles/brand.css:1`<br>`package.json:17-18` |
| **DEPS-001**| Dependencies| **Prune Unused Heavy Dependencies (`motion`)**<br>Uninstall `"motion"` (~100 kB unused dependency) from `package.json`. | **LOW** | **LOW** | **P3** | `package.json:21` |
| **ARCH-003**| Architecture | **Architect Serverless Backend for Payments & Ticketing**<br>Deploy Cloud Functions for payment webhooks, ticket issuance, and gate validation, eliminating direct client writes. | **HIGH** | **HIGH** | **P4** | `src/server/api-middleware.ts`<br>`functions/` |

---

## 6. Execution Priorities & Phased Implementation Roadmap

To systematically execute these improvements without disrupting ongoing feature delivery, the work is organized into four sequential phases.

```
+-----------------------------------------------------------------------------------------+
|                               PHASED EXECUTION ROADMAP                                  |
+-----------------------------------------------------------------------------------------+
| Phase 1: Immediate Critical Security & Data Integrity Fixes        | 0 – 48 Hours        |
| Phase 2: Testing Infrastructure Resuscitation & CI/CD Pipeline     | Week 1 (Days 3 – 7) |
| Phase 3: Architectural Realignment & Performance Optimization      | Weeks 2 – 3         |
| Phase 4: Maintainability, Frontend Tests & Code Cleansing          | Weeks 3 – 4         |
+-----------------------------------------------------------------------------------------+
```

---

### Phase 1: Immediate Critical Security & Data Integrity Fixes (0–48 Hours)
**Objective:** Eliminate active vulnerabilities that expose user PII, permit privilege escalation, or corrupt ticket state.

#### 1.1 Fix Firestore Security Rules Escalation & Lockdown Collections (`SEC-001`, `SEC-002`)
- **File:** `firestore.rules`
- **Actions:**
  1. Restrict `/profiles/{userId}` updates: disallow modifications to `platform_role`, `role`, or `is_suspended` unless the caller possesses verified admin custom claims.
  2. Lock down `/orders/{orderId}`, `/tickets/{ticketId}`, and `/registrations/{regId}`: permit reads only if `request.auth.uid == resource.data.user_id` or caller is verified admin.
  3. Prohibit direct client create/update writes to `/tickets` and `/orders`.

#### 1.2 Remove Plain Ticket ID Gate Validation Bypass (`SEC-003`)
- **File:** `src/lib/db.ts` (lines 1000-1002)
- **Actions:**
  1. Remove `|| t.id === trimmed` from `validateTicketQr`.
  2. Require gate scanning to match exclusively on `token_hash === hashed` or `qr_token === trimmed`.

#### 1.3 Correct Client Ticket Registration Schema (`DATA-001`)
- **File:** `src/lib/client-api.ts` (lines 261-274, 316-329)
- **Actions:**
  1. In `REGISTER_FREE` and `BUY_TICKET`, construct complete `TicketRecord` objects including `event_id: event.id`, `ticket_type_id: ticketType.id`, `attendee_name`, `attendee_email`, `token_hash: hashToken(qrToken)`, and valid status `"VALID"`.
  2. Store `user_id: actorUserId` on `newReg` records so tickets correctly surface in `/api/v1/me/tickets`.

#### 1.4 Disable Default Superadmin Fallback in Dev API Middleware (`SEC-004`)
- **File:** `src/server/api-middleware.ts` (lines 62-64)
- **Actions:**
  1. Remove `|| "usr-superadmin"` fallback.
  2. Reject requests lacking a valid authentication header with HTTP 401 Unauthorized.

#### 1.5 Remove Hardcoded Gmail Superadmin Backdoor (`SEC-005`)
- **Files:** `firestore.rules` (line 35), `src/lib/permissions/rbac.ts` (lines 285-288)
- **Actions:**
  1. Delete `bfos.info@gmail.com` references from rules and RBAC code.

**Phase 1 Verification Gate:**
```bash
# Verify 92 active tests pass cleanly
npm test
# Verify stress test auth hardening
node -e 'const jiti = require("./node_modules/jiti")(process.cwd()); const { verifyAuthToken } = jiti("./src/lib/firebase/auth-middleware.ts"); verifyAuthToken("mock-firebase-token:attacker:admin:attacker@evil.com").catch(e => console.log("Blocked:", e.message));'
```

---

### Phase 2: Testing Infrastructure Resuscitation & CI/CD Pipeline (Week 1)
**Objective:** Resurrect the 230 dormant E2E tests, fix the stress test runner crash, and establish continuous integration.

#### 2.1 Resuscitate 230 E2E Tests in `tests/e2e/harness.ts` (`TEST-001`)
- **Files:** `tests/e2e/harness.ts` (lines 118-135), `tests/e2e/runner.ts` (lines 141-146)
- **Actions:**
  1. Replace broken imports of non-existent `./src/app/api/v1/**/route.ts` files in `harness.ts`.
  2. Implement an in-memory route dispatcher wrapping `src/server/api-middleware.ts` or instantiate a lightweight Node `http.createServer` instance executing the middleware.
  3. Remove the empty catch blocks in `runner.ts` so module errors fail the runner immediately.
  4. Resurrect all 230 tests across `tier1-features.test.ts`, `tier2-boundary.test.ts`, `tier3-combinations.test.ts`, and `tier4-scenarios.test.ts`.

#### 2.2 Fix Stress Test Suite Unhandled Exception (`TEST-003`)
- **File:** `tests/stress-test.ts` (line 178)
- **Actions:**
  1. Wrap `verifyAuthToken` call in `assert.rejects` or a `try...catch` verifying that malformed payloads lacking `uid` throw `DomainError` with status 401.
  2. Add `tests/stress-test.ts` to `npm test` script in `package.json`.

#### 2.3 Declare Explicit Dependencies & Add E2E Script (`TOOL-001`)
- **File:** `package.json`
- **Actions:**
  1. Add `"jiti": "^2.4.2"` and `"tsx": "^4.19.2"` to `devDependencies`.
  2. Add `"test:e2e": "node ./node_modules/.bin/jiti tests/e2e/runner.ts"` to `scripts`.

#### 2.4 Author GitHub Actions CI Pipeline (`TEST-004`)
- **File:** `.github/workflows/ci.yml`
- **Actions:**
  1. Create workflow triggered on `push` and `pull_request` to `main`.
  2. Execute:
     - Step 1: `npm ci`
     - Step 2: `npx tsc --noEmit` (TypeScript type check)
     - Step 3: `npm run build` (Tailwind compilation & Vite production bundle)
     - Step 4: `npm test` (92 unit/RBAC/QA tests)
     - Step 5: `npm run test:e2e` (230 E2E integration tests)

**Phase 2 Verification Gate:**
```bash
npm test
npm run test:e2e
# Expected outcome: 92 unit tests + 230 E2E tests = 322 automated tests passing cleanly
```

---

### Phase 3: Architectural Realignment & Performance Optimization (Weeks 2–3)
**Objective:** Eliminate bundle bloat, scope Firestore read operations, sync architectural documentation, and unify state persistence.

#### 3.1 Implement Route-Level Code Splitting (`PERF-001`)
- **Files:** `src/App.tsx`, `vite.config.ts`
- **Actions:**
  1. Replace static page imports with `React.lazy()` and `<Suspense>`.
  2. Configure Rollup manual chunks in `vite.config.ts` for `vendor`, `firebase`, and `lucide-react`.
  3. Mount `@vitejs/plugin-react` in `vite.config.ts`.
  4. Verify production bundle size drops from 1,365 kB to <250 kB.

#### 3.2 Scope Firestore Queries & Implement Pagination (`PERF-002`)
- **File:** `src/lib/firebase/firestore.ts`
- **Actions:**
  1. In `loadFirestoreState`, remove full collection scans.
  2. Add query constraints: `where("status", "==", "PUBLISHED")`, `limit(20)`.
  3. Load user-specific collections (`tickets`, `orders`) only when authenticated on relevant pages (`/wallet`, `/organizer`).

#### 3.3 Unify RFQ and Booking Persistence (`ARCH-001`)
- **Files:** `src/components/venue/RfqBuilderWizard.tsx`, `src/components/venue/BookingConfirmationModal.tsx`, `src/components/OrganizerWorkspaceView.tsx`
- **Actions:**
  1. Remove isolated `localStorage` writes.
  2. Dispatch RFQs and bookings to `src/lib/client-api.ts` syncing directly to database state.
  3. Connect `OrganizerWorkspaceView` to the shared state hook.

#### 3.4 Implement Order Reservation TTL Sweep (`DATA-002`)
- **File:** `src/lib/db.ts`
- **Actions:**
  1. Add `expires_at` (15 minutes from creation) to `pending` orders.
  2. In inventory calculations, treat expired pending reservations as available stock.

#### 3.5 Sync Architectural Documentation (`DOC-001`)
- **Files:** `PROJECT.md`, `TEST_INFRA.md`
- **Actions:**
  1. Rewrite framework sections to accurately describe Vite 6 + React 19 + React Router v7 SPA architecture.
  2. Remove references to `src/app/page.tsx` and obsolete Next.js patterns.

---

### Phase 4: Maintainability, Frontend Tests & Code Cleansing (Weeks 3–4)
**Objective:** Decompose mega-components, purge dead code, author frontend UI tests, and prepare for serverless backend migration.

#### 4.1 Decompose `OrganizerWorkspaceView.tsx` (`ARCH-002`)
- **Files:** `src/components/OrganizerWorkspaceView.tsx`, `src/components/organizer/*`
- **Actions:**
  1. Split the 2,610-line component into focused subcomponents:
     - `OrganizerKpis.tsx`
     - `EventTable.tsx` (reintegrating orphaned component)
     - `CreateEventWizard.tsx` (reintegrating orphaned component)
     - `AttendeeRoster.tsx`
     - `OrganizerPackageUpgrade.tsx`
  2. Ensure each subcomponent manages its own state or consumes shared context.

#### 4.2 Purge Dead Code & Strip Directives (`CLEAN-001`, `CLEAN-002`, `DEPS-001`)
- **Actions:**
  1. Delete `src/components/MarketplaceView.tsx` (1,081 lines).
  2. Delete `supabase/migrations/0001_aayojon_schema.sql` (290 lines).
  3. Delete redundant pass-through view wrappers (`AttendeeWalletView.tsx`, `AdminConsoleView.tsx`, `CheckInScannerView.tsx`, `SponsorMarketplaceView.tsx`).
  4. Strip `"use client";` directives from 52 source files.
  5. Uninstall unused `"motion"` dependency.

#### 4.3 Implement Frontend Component Testing (`TEST-006`)
- **Actions:**
  1. Install `@testing-library/react` and `happy-dom`.
  2. Author component tests covering:
     - Ticket purchase checkout flow (`CheckoutPage.test.tsx`)
     - QR matrix rendering and high-contrast styling (`AttendeeWallet.test.tsx`)
     - Gate scanner confirmation feedback (`CheckInScanner.test.tsx`)
     - RBAC route protection barriers (`ProtectedRoute.test.tsx`)

#### 4.4 Transition to Serverless Cloud Functions (`ARCH-003`)
- **Actions:**
  1. Author Firebase Cloud Functions in `functions/` handling:
     - `POST /api/v1/webhooks/payments/:provider` (cryptographic HMAC signature verification)
     - `POST /api/v1/orders` (atomic inventory decrement & reservation TTL)
     - `POST /api/v1/tickets/validate` (gate QR scanning)
  2. Configure Firebase Hosting rewrites to direct API requests to Cloud Functions.
  3. Lock Firestore security rules completely against direct client writes to financial collections.

---

## Conclusion

The Aayojon workspace represents an impressive, culturally attuned event management platform with rich domain logic and a solid foundation of 92 passing domain tests. Implementing the four-phase roadmap detailed above will resolve the critical security vulnerabilities exposing user data, resurrect the dormant 230-test E2E test suite to achieve true verification readiness, cut the initial JavaScript bundle by over 70%, and establish an enduring, maintainable architecture ready for production-scale deployment in the Bangladeshi event ecosystem.
