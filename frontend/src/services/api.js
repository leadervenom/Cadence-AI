// Thin wrapper around the backend's REST API (the Express app in /src,
// run separately e.g. `npm start` from the project root, default port 3000).
//
// This frontend is its own Vite project/port, so every request needs a full
// base URL rather than a relative path. Set it via frontend/.env:
//   VITE_API_BASE_URL=http://localhost:3000
//
// The backend currently only exposes stub `GET /api/<module>` status routes
// (see src/routes/*.js + src/controllers/*.js) — getStatus() below talks to
// those. As real endpoints are added to each controller, add matching
// methods here rather than scattering fetch() calls through components.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

export const api = {
  baseUrl: BASE_URL,

  ai: {
    getStatus: () => request("/api/ai"),
  },
  dashboard: {
    getStatus: () => request("/api/dashboard"),
  },
  protocol: {
    getStatus: () => request("/api/protocol"),
  },
  realtime: {
    getStatus: () => request("/api/realtime"),
  },
  runningOrder: {
    getStatus: () => request("/api/running-order"),
  },
};

export default api;
