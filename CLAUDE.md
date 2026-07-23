# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Cadence AI — an event management system (protocol events, VIP hierarchy/kekananan ranking, seating, running order) for Johor state government events, with an AI chat assistant that can read and modify event data. Backend is Node/Express + PostgreSQL; frontend is Vue 3 + Vite, run as two separate processes/ports.

The repo is mid-refactor on the `dev` branch: a large set of previously-added modules (`src/dashboard`, `src/protocol-hierarchy`, `src/realtime-operations`, `src/running-order`, their controllers/routes/tests) has been deleted in favor of a smaller, flatter `events` / `vips` / `ai` surface backed by a single JSONB column. Don't resurrect the deleted modules or their patterns (factories/adapters/observers) — the current architecture intentionally moved away from that.

The repo root holds only two projects, each self-contained with its own `package.json`/`node_modules`/`.env`: `backend/` and `frontend/`. There is no root-level `package.json` — always `cd` into one of the two before running npm commands.

## Commands

Backend (from `backend/`):
```bash
cd backend
npm install
node src/server.js          # starts Express on $PORT (default 3000)
node tests/structured-command.test.js   # runs the one test file directly (no test runner/framework — plain node:assert script, throws on failure, logs "... test passed" on success)
```

Frontend (from `frontend/`):
```bash
cd frontend
npm install
npm run dev        # Vite dev server
npm run build
npm run preview
```

Database: run the SQL files in `backend/database/` **in numeric order** against Postgres (`01_schema.sql` is a destructive reset — drops and recreates all tables; `04_events_data_and_chat.sql` and later are additive migrations, safe to run against an existing DB).

Env vars (`backend/.env` for the backend, `frontend/.env` for Vite):
- Backend: `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_SERVICE_URL`
- Frontend: `VITE_API_BASE_URL` (backend base URL, e.g. `http://localhost:3000` — required since frontend and backend run on different Vite/Express ports), `VITE_ANTHROPIC_API_KEY`

There is no lint/test/build script wired up in `backend/package.json` — it only declares dependencies.

## Architecture

**Layering (backend):** `backend/src/routes/*.js` → `backend/src/controllers/*.js` → `backend/src/repositories/*.js` → `backend/src/database/db.js` (a shared `pg` `Pool`). Routes are thin (bind controller methods); controllers hold request/response logic; repositories hold all SQL. Follow this when adding endpoints rather than putting queries in controllers.

**Event data model — single JSONB blob, not normalized tables.** Each row in `events` has flat SQL columns (name, type, date, venue, status) plus one `event_data JSONB` column holding the live working document: `running_order`, `vips`, `sources`, `seating`, `ai_context`. (A `traffic` section existed but was removed along with the traffic/motorcade and emergency-override UI features — don't reintroduce it.) `EventRepository.updateEventData()` does a shallow Postgres `||` merge of `event_data`, keyed by top-level section. `EVENT_SELECT` in `EventRepository.js` is the single place that shapes the API's event JSON (aliases `event_id → id`, pulls each `event_data` key out with `COALESCE` defaults) — update it there, not per-query, when the event shape changes. Note `event_extractions` (a separate JSONB-snapshot audit table keyed by `extraction_type`) is a distinct, append-only history of published section snapshots, not the live event state.

**AI chat → structured command flow.** `POST /api/ai/chat` (`AIController.chat`) calls the Gemini API directly (no SDK, raw `fetch`), forcing JSON output via `responseMimeType`. The response must match a fixed schema: `{ reply, command: { action, target: {eventId, section}, operation, payload, reason } }`. `StructuredCommandService` (`backend/src/ai-engine/services/StructuredCommandService.js`) parses, normalizes, validates (per-section shape rules — array sections vs object sections support different operations), and applies the command to an in-memory copy of the event; `AIController.persistCommandResult` then writes the changed section back via `EventRepository.updateEventData` and, for sections that map to an `extraction_type`, also writes an `event_extractions` snapshot. **The same apply logic is duplicated on the frontend** in `frontend/src/services/eventCommand.js` (`applyEventCommand`) for optimistic UI updates — the section/operation rules (which sections are array vs object, which operations each supports) must be kept in sync between the two if either changes.

**Frontend.** Single-page Vue 3 app (no router in use despite `vue-router` being a dependency) — `App.vue` holds top-level state (`currentUser`, `events`, `currentEvent`) and switches between `AuthScreen` → `EventsView` → `WorkspaceView` by conditional rendering. `WorkspaceView` hosts the per-event tabs (`RunningOrderTab`, `VipListTab`, `SeatingTab`, `RsvpTab`, `AiChatTab`, `SourcesPanel`), each corresponding to one `event_data` section (except `RsvpTab`, which talks to the relational RSVP endpoints below, not `event_data`). `services/api.js` is a thin fetch wrapper requiring `VITE_API_BASE_URL` since the frontend and backend are separate Vite/Express processes.

**RSVP & invitations — relational, not JSONB.** Unlike the rest of the event document, guest invitations live in real Postgres rows: `vip_profiles` (master directory of people — VIPs *and* general participants, distinguished only by `vip_category`, which includes a plain `'guest'` value for non-VIP invitees) joined to a specific event via `event_vips` (the RSVP status per event: `attendance_status` IN `invited|confirmed|declined|absent|arrived|attended`, plus an `rsvp_token` used for passwordless accept/decline). `RsvpController`/`EventParticipantRepository` (`backend/src/controllers/RsvpController.js`, `backend/src/repositories/EventParticipantRepository.js`) handle: `GET /api/vips/search?q=` (search the shared people directory), `POST /api/events/:eventId/invite` (creates/updates an `event_vips` row with a fresh token, returns `acceptUrl`/`declineUrl`), and the public, unauthenticated `GET /api/rsvp/:token/:decision` that the recipient clicks from the email — it updates `attendance_status` and renders a plain HTML confirmation page (not JSON; a human loads this directly in a browser). **No backend email sending** — `RsvpTab.vue` builds a `mailto:` link (prefilled subject/body with the accept/decline URLs) and hands it to the organizer's own email client, per the product requirement that invites go out from the organizer's own account rather than a service-level mailbox. If a `vip_profiles` row has no email on file (true for most of the seeded kekananan data), the invite flow prompts for one inline and persists it via `VIPProfileRepository.updateEmail`.

**README.md is stale** — it describes an earlier vanilla-JS frontend and a wider controller set (`AuthController`, `SeatingController`, traffic/emergency features) that no longer exist in the code. Trust the source tree over the README for current structure.
