# Aayojon (আয়োজন) — All-in-One Event Management Platform

[![React 19](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite-6.4.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase 11](https://img.shields.io/badge/Firebase-11.0.0-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.3.1-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/QA_Tests-45%2F45_Passed-22C55E?logo=checkmarx&logoColor=white)](tests/)

**Aayojon (আয়োজন)** is a modern, full-stack event discovery, management, promotion, and ticketing platform designed for Bangladesh. It features a single dynamic navigation shell with database-driven Role-Based Access Control (RBAC), dedicated workspace routing, and integrated Firebase Authentication.

---

## 🌟 Key Capabilities

- **Unified Event Discovery**: Fast search, category filtering (Tech, Conferences, Workshops, Cultural Festivals, Competitions), date filtering, and ticket inventory tracking.
- **Dedicated Role-Based Workspaces**: Clean, focused interfaces for Attendees, Organizers, Gate Staff, Venue Partners, Vendors, Sponsors, and Super Administrators.
- **Single Dynamic RBAC Navbar**: Context-aware top navigation that automatically adapts to the authenticated user's role with real-time badges and zero redundant headers.
- **Firebase Authentication**: Production-grade authentication with email/password, session persistence, and custom user role assignment.
- **Bangladeshi Payment Sandboxes**: Native simulation of bKash and Nagad payment gateways with idempotent webhook validation and atomic ticket issuance.
- **Gate Check-In & Scanner**: High-speed QR pass verification with camera support, audio-visual feedback, and double-scan prevention (`ALREADY_USED`).
- **Partner Venue & Services RFQ Marketplace**: Interactive venue catalog, multi-service Request For Quotation (RFQ) builder, itemized bidding, and date locking.
- **AI Event Assistant**: AI-powered planning widget and dedicated assistant for budget estimation, timeline synthesis, and vendor matching.

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) (Pure Single-Page Application) |
| **Build Tool & Dev Server** | [Vite 6](https://vitejs.dev/) with native ESBuild compilation |
| **Routing** | [React Router v7](https://reactrouter.com/) with route-level RBAC guards (`ProtectedRoute`) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + PostCSS compilation |
| **Authentication** | [Firebase Authentication v11](https://firebase.google.com/docs/auth) |
| **Database & Persistence** | Disk-backed JSON engine (`data/aayojon-db.json`) + [Cloud Firestore](https://firebase.google.com/docs/firestore) rules |
| **Testing Harness** | Custom TypeScript runner verifying 45 domain, auth, RFQ, and RBAC invariants |

---

## 🧭 Application Routes & RBAC Architecture

| Route | Page Component | Access Control | Description |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | **Public** | Marketplace hero, featured events, category carousels, CTA |
| `/events` | `EventsPage` | **Public** | Searchable event catalog with filters and live inventory counters |
| `/events/:slug` | `EventDetailPage` | **Public** | Detailed event schedule, ticket tiers, venue specs, checkout |
| `/venues` | `VenuesPage` | **Public** | Partner venue catalog with capacity, AV specs, and pricing |
| `/ai-event-assistant` | `AiAssistantPage` | **Public** | AI Event Planning assistant with budget and schedule generators |
| `/login` | `LoginPage` | **Public** | Clean authentication (Sign In & Sign Up with Role selection) |
| `/wallet` | `AttendeeWalletPage` | **Attendee+** | Digital passes, QR code rendering, offline downloads, booking history |
| `/organizer` | `OrganizerWorkspacePage` | **Organizer+** | Event creation, package upgrade (bKash/Nagad), publishing, attendee CSV |
| `/scanner` | `CheckInScannerPage` | **Staff+** | Camera QR ticket scanner, gate operator verification terminal |
| `/provider` | `ProviderWorkspacePage` | **Venue / Vendor** | Space inventory, RFQ quote builder, itemized bid submission |
| `/sponsor` | `SponsorMarketplacePage` | **Sponsor+** | Sponsorship tiers, proposal submission, brand placement tracking |
| `/admin` | `SuperAdminConsolePage` | **Admin / Super Admin** | User role assignment, account suspension, audit logs, system reset |

---

## 🔥 Firebase Setup Guide

Aayojon uses **Firebase Authentication** for user accounts and **Cloud Firestore** for scalable data persistence.

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `aayojon-platform` (or your preferred name).
3. Disable or enable Google Analytics according to your preference, then click **Create Project**.

### Step 2: Register a Web Application
1. In your Firebase project overview, click the **Web icon (`</>`)** to add a web app.
2. Enter an app nickname (e.g., `Aayojon Web`).
3. Click **Register app**.
4. Firebase will display your `firebaseConfig` object containing:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId`

### Step 3: Enable Firebase Authentication
1. In the Firebase console sidebar, navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, enable **Email/Password**.
4. Click **Save**.

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env` in the root of the project:

```bash
cp .env.example .env
```

Open `.env` and fill in your actual credentials from Step 2:

```env
VITE_FIREBASE_API_KEY=AIzaSyA1234567890abcdef-YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234
```

> **Note**: If `.env` is not configured, Aayojon automatically falls back to its local cryptographic credential store so developers can test and develop offline without setup friction.

### Step 5: (Optional) Deploy Firestore Security Rules
Production-grade security rules are defined in [`firestore.rules`](firestore.rules). To deploy them to your Firebase project:

```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/sameul-hasan/ayojon.git
cd ayojon
npm install
```

### Development Server
Start the local Vite development server with Tailwind CSS pre-compilation:

```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### Production Build & Preview
Build optimized production assets:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The preview server runs by default on [http://localhost:5001/](http://localhost:5001/).

---

## 🧪 Testing Infrastructure & Verification

Aayojon includes an end-to-end automated QA verification test suite covering **45 domain invariants**:

```bash
npm test
```

### Verified Test Suites:
1. **Domain QA Invariants (14 tests)**:
   - Draft creation without package payment
   - Basic package purchase (৳799) with bKash/Nagad verification
   - Webhook idempotency (duplicate deliveries handled cleanly)
   - Publication guard against unverified payments
   - Concurrency control on final ticket inventory
   - Free registration capacity enforcement
   - Unique QR ticket issuance upon verified payment
   - Replay attack defense (double scan rejected as `ALREADY_USED`)
   - Organizer multi-tenant isolation (403 on competitor data access)
   - File upload size and MIME type security limits
   - Admin event suspension and audit log trail
2. **Firebase Authentication & Middleware (8 tests)**:
   - Email/password registration and role assignment
   - Sign-in credential verification & error handling
   - Session recovery and cookie persistence
   - Role mapping across all roles
   - Auth middleware token verification (`withAuth`)
3. **Venue & RFQ Marketplace (8 tests)**:
   - Partner venue catalog integrity & facility specifications
   - Multi-step RFQ submission with technical requirements
   - Itemized quotation calculations & financial invariants
   - Quotation revision workflow & snapshot audit preservation
   - Bidding comparison engine (lowest bid, per-attendee metrics)
   - Scoped RFQ clarification messaging
   - Booking acceptance & escrow deposit date lock
4. **Centralized Role-Based Access Control (15 tests)**:
   - Guest route authorization & 401 unauthenticated redirection
   - Attendee wallet access & cross-user privacy enforcement
   - Organizer event management & competitor editing block
   - Gate staff ticket scan authorization & unassigned event isolation
   - Provider private quote protection (competitor vendor isolation)
   - Privilege self-escalation prevention & audit logging
   - Suspended user restriction from protected operations

---

## 📁 Repository Structure

```
ayojon/
├── .env.example                # Sample Firebase environment configuration
├── firestore.rules             # Production Cloud Firestore Security Rules
├── package.json                # Dependencies and project scripts
├── vite.config.ts              # Vite configuration with API middleware
├── tsconfig.json               # TypeScript compiler options
├── data/
│   └── aayojon-db.json         # Disk-persisted application database
├── src/
│   ├── main.tsx                # Application root entry point
│   ├── App.tsx                 # Central routing table with RBAC guards
│   ├── components/
│   │   ├── layout/             # Dynamic Navbar, Footer, Logo, Account Menu
│   │   ├── auth/               # ProtectedRoute & AccessDeniedView
│   │   ├── attendee/           # TicketWallet, TicketCard, BookingHistory
│   │   ├── organizer/          # EventWorkspace, PublishingModal, Attendees
│   │   ├── admin/              # SuperAdminConsole, CheckInScanner, AuditView
│   │   ├── venue/              # RfqBuilderWizard, QuotationComparison
│   │   ├── sponsor/            # SponsorMarketplace, ProposalForm
│   │   ├── marketplace/        # EventGrid, CategoryBrowser, EventCard
│   │   └── ai/                 # AIAssistantWidget, AiEventPlanner
│   ├── lib/
│   │   ├── firebase/           # Firebase client SDK, config, AuthContext
│   │   ├── permissions/        # RBAC role permissions matrix & helpers
│   │   ├── client-api.ts       # Unified API client & cache management
│   │   ├── db.ts               # Core database mutations & domain invariants
│   │   └── seed.ts             # Initial database seed state
│   ├── pages/                  # Dedicated workspace and public pages
│   ├── server/                 # Express-compatible API middleware for Vite
│   └── styles/
│       └── globals.css         # Tailwind CSS styling
└── tests/                      # Automated QA and requirement test runner
```

---

## 📜 License

Private repository. Copyright © 2026 Aayojon Platform. All rights reserved.
