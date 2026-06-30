<script setup>
import { nextTick, ref, watch } from "vue";
import { askCadenceAI } from "../services/aiChat.js";
import api from "../services/api.js";

const props = defineProps({
  event: { type: Object, required: true },
  username: { type: String, default: "You" },
  active: { type: Boolean, default: false },
  offline: { type: Boolean, default: false },
});
const emit = defineEmits(["toast", "event-updated"]);

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

function documentContext() {
  return props.event.sources.map((source) => ({
    name: source.name,
    status: source.status,
    type: source.type,
    text_excerpt: (source.text || "").slice(0, 12000),
  }));
}

function stripActionBlock(reply) {
  return reply.replace(/```cadence-actions[\s\S]*?```/gi, "").trim();
}

function parseActionBlock(reply) {
  const match = reply.match(/```cadence-actions\s*([\s\S]*?)```/i);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed.actions) ? parsed.actions : [];
  } catch {
    return [];
  }
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      time: String(row.time || row.time_range || "").trim(),
      dur: String(row.dur || row.duration || "").trim(),
      activity: String(row.activity || row.title || "").trim(),
      loc: String(row.loc || row.location || "").trim(),
      role: String(row.role || row.owner || row.notes || "").trim(),
      status: String(row.status || "pending").trim().toLowerCase().replace(/\s+/g, "-"),
    }))
    .filter((row) => row.time && row.activity);
}

function normalizeSeating(seating) {
  const source = seating && typeof seating === "object" ? seating : {};
  const layout = String(source.layout || source.mode || "forum").toLowerCase();
  const rows = Array.isArray(source.rows) ? source.rows : [];
  const seats = Array.isArray(source.seats) ? source.seats : rows.flat();

  return {
    layout: ["circle", "line", "forum"].includes(layout) ? layout : "forum",
    rows,
    seats,
    notes: source.notes || "",
  };
}

async function applyActions(actions) {
  if (!actions.length) return;

  const updates = {};
  for (const action of actions) {
    if (action.type === "replace_running_order") {
      const rows = normalizeRows(action.rows || action.running_order);
      if (rows.length) updates.running_order = rows;
    }

    if (action.type === "update_seating") {
      updates.seating_layout = normalizeSeating(action.seating || action.layout);
    }
  }

  if (!Object.keys(updates).length) return;

  if (props.offline) {
    if (updates.running_order) props.event.running_order = updates.running_order;
    if (updates.seating_layout) props.event.seating = updates.seating_layout;
    emit("toast", "AI updated the local workspace");
    return;
  }

  let updatedEvent = null;
  if (updates.running_order) {
    updatedEvent = await api.events.updateRunningOrder(props.event.id, updates.running_order);
  }
  if (updates.seating_layout) {
    updatedEvent = await api.events.updateSeating(props.event.id, updates.seating_layout);
  }

  if (updatedEvent) {
    emit("event-updated", updatedEvent);
    emit("toast", "AI updated the workspace");
  }
}

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
        uploaded_documents: documentContext(),
        traffic: props.event.traffic,
      },
      null,
      2
    );

    const systemPrompt = `You are Cadence AI inside the Cadence event management app. You are not a separate app and you should not mention unrelated products.

${props.event.ai_context}

Current event data:
${eventCtx}

The uploaded_documents field contains parsed text extracted from user uploads. Use that text as your document source. Do not claim that you cannot read uploaded files when parsed text is present.
If the user asks for a running order, guest list, seating plan, or protocol summary, generate it from current event data and uploaded document excerpts.
If the user asks you to change, revise, reorder, delay, shorten, extend, regenerate, or update the running order or seating plan, include a hidden action block after your user-facing answer.
The action block format must be a fenced block with language cadence-actions containing JSON:
{"actions":[{"type":"replace_running_order","rows":[{"time":"HH:MM-HH:MM","dur":"15m","activity":"Activity","loc":"Location","role":"Owner","status":"pending"}]},{"type":"update_seating","seating":{"layout":"circle|line|forum","rows":[[{"label":"Name","cat":"royalty|vvip|vip|official|guest|empty"}]],"seats":[{"label":"Name","cat":"vip"}],"notes":"short operational note"}}]}
Only include actions that should actually be applied to the workspace. Preserve existing useful event data unless the user explicitly asks to regenerate it.

Be concise, direct, and operational. Use bullet points for lists. Prioritise safety, protocol, and timing.`;

    const apiMessages = [
      ...chatHistory.value.slice(0, -1),
      { role: "user", content: `[Event context provided via system]\n\n${trimmed}` },
    ];

    const rawReply = await askCadenceAI({
      systemPrompt,
      messages: apiMessages,
      event: props.event,
    });
    const actions = parseActionBlock(rawReply);
    const reply = stripActionBlock(rawReply);
    chatHistory.value.push({ role: "assistant", content: reply });
    addMessage("assistant", reply.replace(/\n/g, "<br>"));
    await applyActions(actions);
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
