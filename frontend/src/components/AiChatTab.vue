<script setup>
import { nextTick, ref, watch } from "vue";
import { askCadenceAI, getCadenceChat, saveCadenceChat } from "../services/aiChat.js";

const props = defineProps({
  event: { type: Object, required: true },
  username: { type: String, default: "You" },
});
const emit = defineEmits(["event-updated"]);

const messagesEl = ref(null);
const messages = ref([]); // { role: 'assistant' | 'user', html: string }
const chatHistory = ref([]); // raw { role, content } sent to the API
const inputText = ref("");
const isTyping = ref(false);
let loadToken = 0;

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMessage(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function addMessage(role, html, persist = true) {
  messages.value.push({ role, html });
  scrollToBottom();

  if (persist) {
    persistChat();
  }
}

function addGreeting() {
  addMessage(
    "assistant",
    `Cadence AI ready. I have access to all ${props.event.sources.length} documents for <strong>${escapeHtml(props.event.name)}</strong>. Ask me anything about the running order, VIP protocol, or seating.`
  );
}

async function loadChat() {
  const token = ++loadToken;
  messages.value = [];
  chatHistory.value = [];

  try {
    const chat = await getCadenceChat(props.event.id);
    if (token !== loadToken) return;

    messages.value = Array.isArray(chat.messages) ? chat.messages : [];
    chatHistory.value = Array.isArray(chat.chatHistory) ? chat.chatHistory : [];

    if (!messages.value.length) {
      addGreeting();
    } else {
      scrollToBottom();
    }
  } catch (err) {
    if (token !== loadToken) return;
    addGreeting();
    addMessage("assistant", formatMessage("Chat history could not be loaded: " + err.message));
  }
}

async function persistChat() {
  if (!props.event?.id) return;

  try {
    await saveCadenceChat(props.event.id, {
      messages: messages.value,
      chatHistory: chatHistory.value,
    });
  } catch (err) {
    console.warn("Could not save AI chat", err);
  }
}

watch(() => props.event?.id, loadChat, { immediate: true });

async function sendMessage(text) {
  if (isTyping.value) return;
  const trimmed = (text ?? inputText.value).trim();
  if (!trimmed) return;
  inputText.value = "";
  addMessage("user", formatMessage(trimmed), false);
  chatHistory.value.push({ role: "user", content: trimmed });
  persistChat();

  isTyping.value = true;
  scrollToBottom();

  try {
    const eventCtx = JSON.stringify(
      {
        id: props.event.id,
        name: props.event.name,
        date: props.event.date,
        venue: props.event.venue,
        status: props.event.status,
        running_order: props.event.running_order,
        vips: props.event.vips,
        seating: props.event.seating,
        sources: props.event.sources.map((s) => ({
          name: s.name,
          status: s.status,
          content: s.content || "",
        })),
      },
      null,
      2
    );

    const systemPrompt = `${props.event.ai_context}

Current event data:
${eventCtx}

Be concise, direct, and operational. Use bullet points for lists. Prioritise safety, protocol, and timing.`;

    const apiMessages = [
      ...chatHistory.value.slice(0, -1),
      { role: "user", content: `[Event context provided via system]\n\n${trimmed}` },
    ];

    const response = await askCadenceAI({
      systemPrompt,
      messages: apiMessages,
      event: props.event,
    });
    const reply = response.reply;

    if (response.applied && response.updatedEvent) {
      emit("event-updated", {
        event: response.updatedEvent,
        command: response.command,
      });
    }

    chatHistory.value.push({ role: "assistant", content: reply });
    addMessage("assistant", formatMessage(reply), false);

    persistChat();
  } catch (err) {
    addMessage("assistant", formatMessage(err.message || "Connection error. Please check your network and try again."));
  } finally {
    isTyping.value = false;
  }
}

function handleKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

defineExpose({ sendMessage });

</script>

<template>
  <div class="ai-chat-wrap">
    <div class="ai-messages" ref="messagesEl">
      <div v-for="(m, i) in messages" :key="i" class="ai-msg" :class="m.role">
        <div class="ai-sender">{{ m.role === 'assistant' ? 'Cadence AI' : username }}</div>
        <div class="ai-bubble" v-html="m.html"></div>
      </div>
      <div v-if="isTyping" class="ai-msg assistant">
        <div class="ai-sender">Cadence AI</div>
        <div class="ai-bubble">
          <div class="typing"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>
    <div class="ai-input-bar">
      <textarea
        v-model="inputText"
        placeholder="Ask about this event, running order, VIP protocol…"
        rows="1"
        @keydown="handleKeydown"
      ></textarea>
      <button class="btn-send" type="button" :disabled="isTyping" @click="sendMessage()">
        <i class="ti ti-send" style="font-size:15px"></i>
      </button>
    </div>
  </div>
</template>
