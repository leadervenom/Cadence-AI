<script setup>
import { nextTick, ref, watch } from "vue";
import { askCadenceAI } from "../services/aiChat.js";

const props = defineProps({
  event: { type: Object, required: true },
  username: { type: String, default: "You" },
});

const messagesEl = ref(null);
const messages = ref([]); // { role: 'assistant' | 'user', html: string }
const chatHistory = ref([]); // raw { role, content } sent to the API
const inputText = ref("");
const isTyping = ref(false);

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  });
}

function addMessage(role, html) {
  messages.value.push({ role, html });
  scrollToBottom();
}

function resetChat() {
  chatHistory.value = [];
  messages.value = [];
  addMessage(
    "assistant",
    `Cadence AI ready. I have access to all ${props.event.sources.length} documents for <strong>${props.event.name}</strong>. Ask me anything about the running order, VIP protocol, seating, or traffic logistics.`
  );
}

watch(() => props.event?.id, resetChat, { immediate: true });

async function sendMessage(text) {
  const trimmed = (text ?? inputText.value).trim();
  if (!trimmed) return;
  inputText.value = "";
  addMessage("user", trimmed);
  chatHistory.value.push({ role: "user", content: trimmed });

  isTyping.value = true;
  scrollToBottom();

  try {
    const eventCtx = JSON.stringify(
      {
        name: props.event.name,
        date: props.event.date,
        venue: props.event.venue,
        status: props.event.status,
        running_order: props.event.running_order,
        vips: props.event.vips,
        sources: props.event.sources.map((s) => s.name),
        traffic: props.event.traffic,
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

    const reply = await askCadenceAI({ systemPrompt, messages: apiMessages });
    chatHistory.value.push({ role: "assistant", content: reply });
    addMessage("assistant", reply.replace(/\n/g, "<br>"));
  } catch (err) {
    addMessage("assistant", err.message || "Connection error. Please check your network and try again.");
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

// Used by the parent when an emergency broadcast is fired.
function pushEmergencyMessage(msg) {
  chatHistory.value.push({ role: "user", content: "[EMERGENCY BROADCAST] " + msg });
  addMessage("user", "⚠️ " + msg);
  isTyping.value = true;
  scrollToBottom();
  setTimeout(() => {
    isTyping.value = false;
    addMessage(
      "assistant",
      `<strong>Emergency acknowledged.</strong> Broadcasting: <em>"${msg}"</em><br><br>Recommended actions:<br>• Notify all department heads immediately<br>• Update running order if timing is affected<br>• Confirm with VIP escort team on revised schedule<br>• Update convoy ETA if traffic-related`
    );
  }, 1200);
}

defineExpose({ pushEmergencyMessage });
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
      <button class="btn-send" type="button" @click="sendMessage()">
        <i class="ti ti-send" style="font-size:15px"></i>
      </button>
    </div>
  </div>
</template>
