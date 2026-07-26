# Architecture decisions

## 2026-07-25 — Protect-by-default routing + centralized error handling (ported from Greenstep)

**Context.** Cadence and the unrelated `Greenstep` project (a separate PHP/Slim + Vue app on this
machine) independently converged on the same backend layering: `routes → controllers →
repositories → db`. Comparing the two surfaced two gaps in Cadence specifically:

1. Only `GET /api/auth/me` was behind `authMiddleware`. Every event, VIP, and AI-chat route was
   fully public — anyone with the base URL could read/write event data or spend the Gemini API
   budget with no token. This wasn't a deliberate choice, just something that hadn't been wired up
   yet; the frontend (`frontend/src/services/api.js`) already attached the JWT to every request
   when one exists, so closing the gap required no frontend change.
2. Every controller method repeated the same `try { ... } catch (error) { console.error(error);
   res.status(500).json({ error: "Failed to X" }) }` shape. Greenstep's PHP controllers centralize
   response shaping in one `json()` helper per controller; the Node/Express equivalent of "one
   place shapes the response" is an async-route wrapper + a single error-handling middleware.

**Decision.**
- `router.use(authMiddleware)` at the top of every route file except `authRoutes.js`
  (`/register`, `/login` must be reachable with no token) and `rsvpRoutes.js` (the
  `GET /:token/:decision` link a guest clicks from an email has no session — the token itself is
  the credential). This makes "protected" the default and "public" something you opt into
  explicitly, rather than the other way around.
- `backend/src/middleware/asyncHandler.js` wraps async controller methods where they're mounted
  in the router; `backend/src/middleware/errorHandler.js` is mounted last in `server.js` and is
  the only place that turns an unexpected exception into a JSON response. Controllers keep their
  *expected*-outcome branches (400 for bad input, 404 for missing rows, 409 for conflicts, 502 for
  a downstream email failure) as explicit early returns — only genuinely unexpected errors fall
  through to the shared handler, which logs the real error server-side but returns a generic
  `{ error: "Internal server error" }` to the client instead of a raw driver/DB message.
- `RsvpController.respond` (the public HTML confirmation page, not a JSON endpoint) was
  deliberately left out of this — it keeps its own try/catch because its error path also renders
  HTML, not JSON.

**Explicitly not ported:** Greenstep's `POST /api/reset` (wipe-and-reseed demo data for a
hardcoded `user_id = 1`). Cadence keeps seed data as plain SQL files under `backend/database/`
(`02_seed_kekananan.sql`, `05_seed_demo_events.sql`, `08_seed_test_participant.sql`) run manually
alongside the schema migrations — no live reset endpoint.

**Why it matters for future work.** If you add a new route file, mount it with
`router.use(authMiddleware)` unless you have a specific reason it must be public (and say so in a
comment, as `rsvpRoutes.js` does). If you add a controller method, let unexpected errors throw
rather than wrapping them in your own try/catch/500 — only add a try/catch for a branch you want
to give a *specific* status code or message.
