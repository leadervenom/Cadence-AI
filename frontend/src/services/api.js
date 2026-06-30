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

  health: () => request("/api/health"),

  events: {
    list: () => request("/api/events"),
    create: (data) =>
      request("/api/events", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (eventId) => request(`/api/events/${eventId}`),
    uploadDocument: (eventId, data) =>
      request(`/api/events/${eventId}/documents`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateExtraction: (eventId, type, data) =>
      request(`/api/events/${eventId}/extractions/${type}`, {
        method: "PUT",
        body: JSON.stringify({ data }),
      }),
    updateRunningOrder: (eventId, rows) =>
      request(`/api/events/${eventId}/extractions/running_order`, {
        method: "PUT",
        body: JSON.stringify({ data: rows }),
      }),
    updateSeating: (eventId, seating) =>
      request(`/api/events/${eventId}/extractions/seating_layout`, {
        method: "PUT",
        body: JSON.stringify({ data: seating }),
      }),
    updateTraffic: (eventId, traffic) =>
      request(`/api/events/${eventId}/extractions/traffic_flow`, {
        method: "PUT",
        body: JSON.stringify({ data: traffic }),
      }),
    updateVips: (eventId, vips) =>
      request(`/api/events/${eventId}/vips`, {
        method: "PUT",
        body: JSON.stringify({ vips }),
      }),
  },

  ai: {
    getStatus: () => request("/api/ai"),
    chat: (data) =>
      request("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    parseProtocol: (data) =>
      request("/api/ai/protocol/parse", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    generateProtocolRunningOrder: (data) =>
      request("/api/ai/protocol/running-order", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    extractProtocol: (data) =>
      request("/api/ai/protocol/extract", {
        method: "POST",
        body: JSON.stringify(data),
      }),
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
