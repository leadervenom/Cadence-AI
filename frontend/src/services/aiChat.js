import api from "./api.js";

export async function askCadenceAI({ systemPrompt, messages }) {
  const res = await fetch(`${api.baseUrl}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemPrompt,
      messages,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `AI request failed: ${res.status}`);
  }

  return data.reply || "Unable to get a response. Please try again.";
}
