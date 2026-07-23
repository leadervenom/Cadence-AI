import api from "./api.js";

export async function askCadenceAI({ systemPrompt, messages, event }) {
  const res = await fetch(`${api.baseUrl}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemPrompt,
      messages,
      event,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `AI request failed: ${res.status}`);
  }

  return {
    ...data,
    reply: data.reply || "Unable to get a response. Please try again.",
  };
}

export async function getCadenceChat(eventId) {
  const res = await fetch(`${api.baseUrl}/api/ai/chats/${encodeURIComponent(eventId)}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || `Load chat failed: ${res.status}`);
  }

  return data;
}

export async function saveCadenceChat(eventId, chat) {
  const res = await fetch(`${api.baseUrl}/api/ai/chats/${encodeURIComponent(eventId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(chat),
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || `Save chat failed: ${res.status}`);
  }

  return data;
}
