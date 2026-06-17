# Cadence Frontend

Vue 3 + Vite single-page app for Cadence Operations. This is a **standalone
project** with its own `package.json` and `node_modules`, separate from the
backend in `/src` (the Express API). Run them as two independent processes,
on two different ports, during development.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` and point `VITE_API_BASE_URL` at wherever the backend is running
(`npm start` from the project root runs the Express server in `/src`,
default port 3000):

```
VITE_API_BASE_URL=http://localhost:3000
VITE_DEV_SERVER_PORT=5173
```

The backend already enables CORS (see `src/server.js`), so the frontend can
call it directly with `fetch`/`VITE_API_BASE_URL` — no proxy required. If you
prefer to avoid CORS entirely, set `VITE_USE_PROXY=true` and the dev server
will forward `/api/*` to the backend for you.

## Run

```bash
npm run dev
```

This starts the Vite dev server on `VITE_DEV_SERVER_PORT` (5173 by default).
Open it in the browser; it's fully independent of the backend's port.

To build for production:

```bash
npm run build   # outputs to frontend/dist
npm run preview # serve the production build locally
```

## Project layout

```
frontend/
├── index.html              Vite entry HTML
├── package.json
├── vite.config.js
├── .env.example
└── src/
    ├── main.js              Mounts the Vue app
    ├── App.vue              Root component: auth, routing between
    │                        events list / workspace, modal, toast
    ├── style.css            Global styles & design tokens (ported 1:1
    │                        from the original static prototype)
    ├── data/
    │   └── events.js        Seed/mock event data
    ├── services/
    │   ├── api.js           Wrapper for the backend's /api/* routes
    │   └── aiChat.js        Direct browser → Anthropic Messages API call
    │                        used by the AI Assistant tab
    └── components/
        ├── AuthScreen.vue
        ├── TopBar.vue
        ├── EventsView.vue
        ├── EventCard.vue
        ├── CreateEventModal.vue
        ├── WorkspaceView.vue
        ├── SourcesPanel.vue
        ├── RunningOrderTab.vue
        ├── VipListTab.vue
        ├── SeatingTab.vue
        ├── TrafficTab.vue
        ├── AiChatTab.vue
        ├── EmergencyBar.vue
        ├── ModulesPanel.vue
        └── ToastNotification.vue
```

## Notes

- The backend's controllers (`src/controllers/*.js`) currently only expose a
  stub `GET /api/<module>` status route each. `src/services/api.js` already
  has matching methods (`api.runningOrder.getStatus()`, etc.) — wire up
  components to call those as real endpoints land, instead of relying on
  `data/events.js`.
- The AI Assistant tab calls `https://api.anthropic.com/v1/messages` directly
  from the browser using `VITE_ANTHROPIC_API_KEY`, matching the original
  prototype's behavior. That means the key is visible client-side. Before
  using this with real users, move the call server-side (e.g. flesh out
  `POST /api/ai` in the backend to hold the key) and call that endpoint from
  `aiChat.js` instead.
- `cadence-frontend.html`, the original single-file prototype this app was
  rebuilt from, is kept out of the build (it's no longer referenced); you can
  delete it once you've confirmed the Vue version covers everything you need.
