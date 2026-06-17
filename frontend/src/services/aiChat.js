// Calls the Anthropic Messages API directly from the browser, preserving the
// original prototype's behavior. This requires VITE_ANTHROPIC_API_KEY to be
// set, AND it means the key is exposed client-side — fine for local/internal
// prototyping, but before shipping this to real users, move this call into
// the backend (e.g. flesh out POST /api/ai with an endpoint that holds the
// key server-side) and call that instead via src/services/api.js.

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

export async function askCadenceAI({ systemPrompt, messages }) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      "Missing VITE_ANTHROPIC_API_KEY. Set it in frontend/.env to enable the AI Assistant tab."
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `AI request failed: ${res.status}`);
  }
  return data.content?.[0]?.text || "Unable to get a response. Please try again.";
}
