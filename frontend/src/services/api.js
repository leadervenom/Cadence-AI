// Thin wrapper around the backend's REST API (the Express app in /src,
// run separately e.g. `npm start` from the project root, default port 3000).
//
// This frontend is its own Vite project/port, so every request needs a full
// base URL rather than a relative path. Set it via frontend/.env:
//   VITE_API_BASE_URL=http://localhost:3000

import { getToken } from "./authStore.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || body?.message || `Request failed: ${res.status}`);
    }
    const text = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

export const api = {
  baseUrl: BASE_URL,

  auth: {
    register: (payload) =>
      request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    login: (email, password) =>
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request("/api/auth/me"),
    acceptInvite: (payload) =>
      request("/api/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  ai: {
    getStatus: () => request("/api/ai"),
    chat: (payload) =>
      request("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getChat: (eventId) => request(`/api/ai/chats/${encodeURIComponent(eventId)}`),
    saveChat: (eventId, chat) =>
      request(`/api/ai/chats/${encodeURIComponent(eventId)}`, {
        method: "PUT",
        body: JSON.stringify(chat),
      }),
  },
  vips: {
    getAll: () => request("/api/vips"),
    getById: (id) => request(`/api/vips/${encodeURIComponent(id)}`),
    search: (q) => request(`/api/vips/search?q=${encodeURIComponent(q)}`),
  },
  events: {
    getAll: () => request("/api/events"),
    getById: (id) => request(`/api/events/${encodeURIComponent(id)}`),
    create: (payload) =>
      request("/api/events", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getParticipants: (id) => request(`/api/events/${encodeURIComponent(id)}/participants`),
    invite: (id, payload) =>
      request(`/api/events/${encodeURIComponent(id)}/invite`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    inviteOrganizer: (id, email) =>
      request(`/api/events/${encodeURIComponent(id)}/organizers/invite`, {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  },
  seating: {
    update: (eventId, seating) =>
      request(`/api/events/${encodeURIComponent(eventId)}/seating`, {
        method: "PUT",
        body: JSON.stringify(seating),
      }),
  },
};

export default api;
