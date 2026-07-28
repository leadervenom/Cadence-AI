<script setup>
import { nextTick, ref, watch } from "vue";
import api from "../services/api.js";

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

function addMessage(role, html, persist = true, proposedAction = null) {
  messages.value.push({ role, html, proposedAction });
  scrollToBottom();

  if (persist) {
    persistChat();
  }
}

const confirmingAction = ref(false);

async function confirmProposedAction(message) {
  const action = message.proposedAction;
  if (!action || action.type !== "rsvp_invite" || confirmingAction.value) return;

  confirmingAction.value = true;
  try {
    await api.events.invite(action.eventId, {
      vipId: action.vipId,
      role: action.role,
      email: action.email,
    });
    message.proposedAction = { ...action, status: "sent" };
    addMessage("assistant", formatMessage(`Invite sent to ${action.vipName}.`));
  } catch (err) {
    message.proposedAction = { ...action, status: "failed" };
    addMessage("assistant", formatMessage(`Could not send the invite: ${err.message}`));
  } finally {
    confirmingAction.value = false;
    persistChat();
  }
}

function cancelProposedAction(message) {
  if (!message.proposedAction) return;
  message.proposedAction = { ...message.proposedAction, status: "cancelled" };
  persistChat();
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
    const chat = await api.ai.getChat(props.event.id);
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
    await api.ai.saveChat(props.event.id, {
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
    // Event data (including source document content) is assembled
    // server-side per request — see AIController.buildSystemInstruction /
    // sourceContextBuilder.js — so only the organizer's own instructions
    // travel from here.
    const systemPrompt = `${props.event.ai_context}

Be concise, direct, and operational. Use bullet points for lists. Prioritise safety, protocol, and timing.`;

    // Cap how much prior chat gets replayed to the model. Sending the entire
    // history back on every turn means old failed/confused replies keep
    // getting fed back in as context, anchoring the model into repeating them
    // instead of trying fresh — capping to recent turns avoids that snowball.
    const HISTORY_TURNS_LIMIT = 12;
    const apiMessages = [
      ...chatHistory.value.slice(0, -1).slice(-HISTORY_TURNS_LIMIT),
      { role: "user", content: `[Event context provided via system]\n\n${trimmed}` },
    ];

    const response = await api.ai.chat({
      systemPrompt,
      messages: apiMessages,
      event: props.event,
    });
    const reply = response.reply || "Unable to get a response. Please try again.";

    if (response.applied && response.updatedEvent) {
      emit("event-updated", {
        event: response.updatedEvent,
        command: response.toolCall,
      });
    }

    chatHistory.value.push({ role: "assistant", content: reply });
    addMessage("assistant", formatMessage(reply), false, response.proposedAction || null);

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
        <div v-if="m.proposedAction && m.proposedAction.type === 'rsvp_invite'" class="ai-proposed-action">
          <template v-if="!m.proposedAction.status || m.proposedAction.status === 'pending'">
            <button class="btn-primary" type="button" :disabled="confirmingAction" @click="confirmProposedAction(m)">
              {{ confirmingAction ? "Sending…" : `Confirm invite to ${m.proposedAction.vipName}` }}
            </button>
            <button class="btn-secondary" type="button" :disabled="confirmingAction" @click="cancelProposedAction(m)">Cancel</button>
          </template>
          <div v-else-if="m.proposedAction.status === 'sent'" class="ai-action-note">Invite sent.</div>
          <div v-else-if="m.proposedAction.status === 'cancelled'" class="ai-action-note">Cancelled.</div>
          <div v-else-if="m.proposedAction.status === 'failed'" class="ai-action-note">Send failed.</div>
        </div>
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
