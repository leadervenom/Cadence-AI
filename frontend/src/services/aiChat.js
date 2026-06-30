import api from "./api.js";

export async function askCadenceAI({ systemPrompt, messages, event }) {
  const data = await api.ai.chat({
    systemPrompt,
    message: messages[messages.length - 1]?.content || "",
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    event,
  });

  return data.reply || data.response || data.result || "Unable to get a response. Please try again.";
}
