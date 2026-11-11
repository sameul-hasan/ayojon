# Aayojon

Aayojon (আয়োজন) is a full-stack event platform for discovering, managing, promoting, and ticketing events. It is designed as a modular, multi-portal web application for organizers, attendees, sponsors, admins, and event staff.

## Product overview

The platform supports the full event lifecycle:

- Event discovery and browsing
- Organizer event creation and management
- Ticket purchase and checkout
- Attendee wallet with QR passes and order history
- Sponsor marketplace and proposals
- Staff check-in and validation flows
- Admin moderation and audit controls

This repository contains the application, supporting docs, and QA/test infrastructure for the platform.

## Core features

- Marketplace and event listing views
- Organizer workspace with dashboards and workflow tools
- Event promotion and UTM-style campaign support
- QR-based attendee ticket validation
- Firebase-backed auth and data layer
- Firestore-first persistence with a test-friendly fallback adapter
- Light, responsive UI built with Tailwind CSS

## Tech stack

- Frontend: Next.js 16, React 19, TypeScript
- Styling: Tailwind CSS 4
- Backend/API: Next.js App Router route handlers
- Authentication: Firebase Authentication
- Data layer: Firestore + fallback in-memory adapter
- Testing: TypeScript QA suites and requirement-driven E2E tests

## Project structure

- `src/app/` — application shell and page-level routing
- `src/components/` — portal views including marketplace, wallet, organizer workspace, scanner, sponsor, and admin console
- `src/lib/` — Firebase, auth, DB adapters, and shared application logic
- `supabase/` — schema and database-related assets
- `tests/` — automated QA and end-to-end test suites
- `scripts/` — build-time setup scripts
- `Event_Management_Platform_Complete_Documentation_Pack/` — project documentation pack
- `PROJECT.md` — implementation and architecture summary
- `TEST_INFRA.md` — testing infrastructure and QA details

## Getting started

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run the test suite:

```bash
npm test
```

## Notes

- This project is built around a modular monolith architecture with multiple user personas in a single application shell.
- The documentation pack and project notes describe a broader product specification than the code alone, so `PROJECT.md` is useful for understanding planned features and requirements.
- The repo also includes a required CSS build step handled by `scripts/build-css.cjs` before local dev/build.

## Related documentation

- `PROJECT.md` — architecture, feature list, milestones, and code layout
- `TEST_INFRA.md` — QA and test strategy
- `Event_Management_Platform_Complete_Documentation_Pack/` — product and system documentation pack
