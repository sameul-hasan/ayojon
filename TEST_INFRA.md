# TEST_INFRA — Aayojon Platform Test Infrastructure & Execution Model

This document specifies the architecture, execution model, runner harness, assertion helpers, and guidelines for the requirement-driven E2E test suite in the Aayojon event management platform.

---

## 1. Principles & Design Philosophy

1. **Strictly Opaque-Box**:
   Tests must interact with the application solely through its public interfaces:
   - Next.js API Route Endpoints (`/api/v1/...`)
   - Persona authentication headers (`x-user-id`, `Authorization: Bearer mock-token-...`)
   - Client request payloads and query parameters
   - HTTP response codes, headers, and JSON error bodies
   - User-visible and contract-visible design tokens
   *Private internal state, unexported helpers, and hidden database globals are never inspected directly by tests.*

2. **Deterministic State Isolation**:
   Every test execution is completely isolated. Between tests, the database state is cleanly reset via `harness.resetToSeed()` to the canonical Bangladesh pilot seed (6 personas, 7 events, ticket categories, venues, and organizations). Tests never leak state or depend on run order.

3. **Dual Execution Engine**:
   - **In-Memory Route Dispatcher (Default)**: Dispatches requests directly to Next.js App Router handlers (`GET`, `POST`, `PUT`, `DELETE`) with `NextRequest` and `NextResponse`. Zero server overhead, zero port conflicts, >100 tests per second.
   - **HTTP Network Client (Integration)**: When `E2E_BASE_URL` is set (e.g. `http://localhost:3000`), requests are transparently routed via native HTTP `fetch()`, enabling testing of live dev or production instances.

4. **Universal Transpiler Compatibility**:
   Out-of-the-box execution under:
   - `node ./node_modules/.bin/jiti tests/e2e/runner.ts` (Fastest, zero-install)
   - `npx tsx tests/e2e/runner.ts`
   - `npm run test:e2e` / `npm test`

---

## 2. Directory Layout & Artifact Inventory

```
tests/
├── qa-suite.test.ts               # Domain invariant QA suite (QA-001 through QA-014)
└── e2e/
    ├── harness.ts                 # Client simulator, persona switcher, route dispatcher, assertions
    ├── runner.ts                  # CLI runner, suite aggregator, table reporter
    ├── tier1-features.test.ts     # Tier 1: Feature Coverage (>=5 tests per feature for 20 features = 100 tests)
    ├── tier2-boundary.test.ts     # Tier 2: Boundary & Corner Cases (>=5 tests per feature for 20 features = 100 tests)
    ├── tier3-combinations.test.ts # Tier 3: Cross-Feature Interactions (>=20 pairwise combinations = 20 tests)
    └── tier4-scenarios.test.ts    # Tier 4: Real-World Scenarios (>=10 multi-persona life cycles = 10 tests)
```

Total E2E Tests: **230 tests**

---

## 3. Personas & Authentication Simulation

The test harness provides pre-configured mock personas reflecting the Bangladesh event management ecosystem:

| Persona Key | User ID | Name | Role | Organization |
|---|---|---|---|---|
| `attendee` | `usr-attendee-rafiq` | Rafiqul Islam | `ATTENDEE` | CSE Undergraduate, BUET |
| `organizer` | `usr-org-nusrat` | Nusrat Jahan | `ORGANIZER_OWNER` | BUET Computer Club |
| `organizer2` | `usr-org-tanvir` | Tanvir Ahmed | `ORGANIZER_OWNER` | NSU Young Entrepreneurs Society |
| `staff` | `usr-staff-mehedi` | Mehedi Hasan | `CHECKIN_STAFF` | Gate Staff, BUET Computer Club |
| `sponsor` | `usr-sponsor-farhana` | Farhana Rahman | `SPONSOR` | Brand Partnerships, Pathao Ventures |
| `admin` | `usr-admin-tariq` | Tariq Mahmud | `ADMIN` | Platform Trust & Operations |

### Switching Personas in Tests
```typescript
import { TestHarness } from "./harness";

const harness = new TestHarness();

// Set active persona
harness.asPersona("organizer");

// Dispatch authenticated request
const res = await harness.post("/api/v1/events", { title: "New Event" });

// Switch to attendee
harness.asPersona("attendee");
const buyRes = await harness.post("/api/v1/orders", { eventId: "evt-123", items: [...] });

// Simulate unauthenticated request
harness.asAnonymous();
const pubRes = await harness.get("/api/v1/events");
```

---

## 4. Test Harness API Reference

### 4.1 Invocation Methods
- `harness.get(path, options)`: Dispatches GET request.
- `harness.post(path, body, options)`: Dispatches POST request.
- `harness.put(path, body, options)`: Dispatches PUT request.
- `harness.patch(path, body, options)`: Dispatches PATCH request.
- `harness.delete(path, options)`: Dispatches DELETE request.
- `harness.resetToSeed()`: Resets database state to initial seed.
- `harness.signWebhook(payload)`: Signs webhook raw body with HMAC-SHA256 secret.

### 4.2 Request Options
```typescript
interface RequestOptions {
  headers?: Record<string, string>;
  persona?: PersonaKey | string | null;
  idempotencyKey?: string;
  query?: Record<string, string | number | boolean>;
}
```

### 4.3 Response Structure
```typescript
interface TestResponse<T = any> {
  status: number;       // HTTP Status Code (200, 201, 400, 403, 404, etc.)
  statusText: string;   // HTTP Status Text ("OK", "Forbidden", etc.)
  headers: Headers;     // Response Headers
  body: T;              // Full JSON parsed body
  data: any;            // Shortcut to body.data
  error?: {             // Error object if failed
    code: string;
    message: string;
  };
  rawText: string;      // Unparsed response string
  ok: boolean;          // true if status in 200..299
}
```

---

## 5. Opaque Assertion Helper Reference

```typescript
import { expect } from "./harness";

// Status assertions
expect.ok(res);                         // Asserts HTTP 2xx
expect.status(res, 201);                // Asserts exact status
expect.error(res, "FORBIDDEN", 403);    // Asserts error code and 403 status
expect.forbidden(res);                  // Asserts HTTP 403
expect.notFound(res);                   // Asserts HTTP 404
expect.validationError(res);            // Asserts HTTP 400 with VALIDATION_ERROR

// Invariant & Domain assertions
expect.idempotent(res1, res2);          // Asserts identical outcomes for retry
expect.lightThemeTokens(cssOrHtml);     // Asserts required light palette tokens
expect.noDarkArtifacts(cssOrHtml);      // Asserts zero dark mode artifacts
```

---

## 6. The 4-Tier Testing Model

| Tier | Name | Target Ratio | Total Tests | Primary Objective |
|---|---|---|---|---|
| **Tier 1** | Feature Coverage | 5 tests × 20 features | **100 tests** | Validate happy paths, core functional requirements, and standard UI/API interactions. |
| **Tier 2** | Boundary & Corner Cases | 5 tests × 20 features | **100 tests** | Validate edge limits, negative inputs, concurrency conflicts, invalid payloads, and security blocks. |
| **Tier 3** | Cross-Feature Interactions | 20 pairwise combinations | **20 tests** | Validate state handoffs, cross-portal transitions, and inter-service dependencies. |
| **Tier 4** | Real-World End-to-End Scenarios | 10 complete lifecycles | **10 tests** | Validate multi-persona journeys from event inception to post-event gate auditing and analytics. |
| **Total** | Full E2E Test Suite | — | **230 tests** | Complete requirement verification across R1, R2, R3, and all 14 domain QA invariants. |

### Feature Coverage Breakdown (20 Features)
- `FEAT-AUTH-001`: Firebase App Configuration & SDK Setup
- `FEAT-AUTH-002`: Firebase Authentication Provider & Context Hooks
- `FEAT-AUTH-003`: Dual-Mode Persona Bridge
- `FEAT-AUTH-004`: API Route Auth Middleware & Token Verification
- `FEAT-DB-001`: Firestore Data Models, Collections & Type Converters
- `FEAT-DB-002`: Firestore Database Adapter for CRUD Operations
- `FEAT-DB-003`: Atomic Firestore Transactions
- `FEAT-DB-004`: Dual-Mode Persistence Fallback
- `FEAT-DB-005`: Declarative Firestore Security Rules (RBAC)
- `FEAT-UI-001`: Light Theme System, Variables & Design Tokens
- `FEAT-UI-002`: Application Shell, Navigation & Portal Switching
- `FEAT-UI-003`: `MarketplaceView` Minimal Light Theme & Checkout
- `FEAT-UI-004`: `AttendeeWalletView` Minimal Light Theme & QR Passes
- `FEAT-UI-005`: `SponsorMarketplaceView` Minimal Light Theme & Proposals
- `FEAT-UI-006`: `OrganizerWorkspaceView` Minimal Light Theme & Wizard
- `FEAT-UI-007`: `CheckInScannerView` Minimal Light Theme & Validation
- `FEAT-UI-008`: `AdminConsoleView` Minimal Light Theme & Moderation
- `FEAT-TEST-001`: Automated Test Runner & Firebase Auth/DB Tests
- `FEAT-TEST-002`: Comprehensive 4-Tier E2E Test Suite
- `FEAT-VERIF-001`: Visual, Contrast, and Responsive DevTools Verification

---

## 7. Running the Test Suite

| Command | Purpose |
|---|---|
| `npm test` | Runs compiled unit and QA invariant tests (`qa-suite.test.ts`) |
| `npm run test:e2e` | Runs comprehensive 4-Tier E2E test suite |
| `node ./node_modules/.bin/jiti tests/e2e/runner.ts` | Direct zero-install E2E test run (all 230 tests) |
| `node ./node_modules/.bin/jiti tests/e2e/runner.ts --tier=1` | Runs only Tier 1 Feature Coverage tests (100 tests) |
| `node ./node_modules/.bin/jiti tests/e2e/runner.ts --tier=2` | Runs only Tier 2 Boundary tests (100 tests) |
| `node ./node_modules/.bin/jiti tests/e2e/runner.ts --tier=3` | Runs only Tier 3 Cross-Feature combinations (20 tests) |
| `node ./node_modules/.bin/jiti tests/e2e/runner.ts --tier=4` | Runs only Tier 4 Real-World Scenarios (10 tests) |
| `node ./node_modules/.bin/jiti tests/e2e/runner.ts --grep="AUTH"` | Runs tests matching pattern "AUTH" |
| `node ./node_modules/.bin/jiti tests/e2e/runner.ts --bail` | Stops execution immediately upon first failure |
