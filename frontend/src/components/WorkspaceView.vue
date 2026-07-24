<script setup>
import { computed, nextTick, ref } from "vue";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import mammoth from "mammoth";
import SourcesPanel from "./SourcesPanel.vue";
import RunningOrderTab from "./RunningOrderTab.vue";
import VipListTab from "./VipListTab.vue";
import SeatingTab from "./SeatingTab.vue";
import RsvpTab from "./RsvpTab.vue";
import AiChatTab from "./AiChatTab.vue";
import ModulesPanel from "./ModulesPanel.vue";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const MAX_CONTENT_CHARS = 20000;
const GENERATE_RUNNING_ORDER_PROMPT =
  "Read all parsed source documents in context and generate a complete running order for this event from their content. " +
  "Use operation \"replace\" on the running_order section with a properly ordered, properly shaped array.";

const props = defineProps({
  event: { type: Object, required: true },
  username: { type: String, default: "You" },
});
const emit = defineEmits(["toast", "event-updated"]);

const activeTab = ref("vip-list");
const aiChatRef = ref(null);

const tabs = [
  { id: "vip-list", icon: "ti-users", label: "VIP List" },
  { id: "seating", icon: "ti-layout-rows", label: "Layouts" },
  { id: "rsvp", icon: "ti-mail", label: "RSVP" },
  { id: "ai-chat", icon: "ti-sparkles", label: "AI Assistant" },
];

const headerLabels = {
  "running-order": { title: "Running Order Timeline", sub: () => "Live event schedule — " + props.event.name },
  "vip-list": { title: "VIP Management", sub: () => "Guest list & protocol hierarchy" },
  seating: { title: "Layouts", sub: () => "Floor plans & seat assignments" },
  rsvp: { title: "RSVP & Invitations", sub: () => "Search, invite, and track attendance" },
  "ai-chat": { title: "AI Assistant", sub: () => "Event intelligence powered by Gemini" },
};

const wsTitle = computed(() => headerLabels[activeTab.value]?.title || "");
const wsSub = computed(() => headerLabels[activeTab.value]?.sub() || "");

function switchTab(tab) {
  activeTab.value = tab;
}

function fileTypeFor(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "file";
  if (ext === "doc") return "docx";
  return ext;
}

function readableSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isPlainText(file) {
  const ext = fileTypeFor(file);
  return file.type.startsWith("text/") || ["json", "csv", "txt", "md"].includes(ext);
}

async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";

  for (let pageNum = 1; pageNum <= pdf.numPages && text.length < MAX_CONTENT_CHARS; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str || "").join(" ") + "\n";
  }

  return text.slice(0, MAX_CONTENT_CHARS);
}

async function extractDocxText(file) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return (result.value || "").slice(0, MAX_CONTENT_CHARS);
}

async function readSourceContent(file) {
  const ext = fileTypeFor(file);

  if (ext === "pdf") return extractPdfText(file);
  if (ext === "docx") return extractDocxText(file);

  if (isPlainText(file)) {
    const text = await file.text();
    return text.slice(0, MAX_CONTENT_CHARS);
  }

  return "";
}

async function handleUpload(files = []) {
  for (const file of files) {
    const newSource = {
      name: file.name,
      size: readableSize(file.size),
      status: "processing",
      type: fileTypeFor(file),
      content: "",
    };
    props.event.sources.unshift(newSource);
    emit("toast", "Uploading " + file.name);

    try {
      newSource.content = await readSourceContent(file);
      newSource.status = newSource.content ? "parsed" : "uploaded";
      emit("toast", file.name + (newSource.content ? " parsed" : " uploaded"));
    } catch (err) {
      newSource.status = "error";
      emit("toast", "Could not read " + file.name);
    }
  }
}

function handleGenerateRunningOrder() {
  switchTab("ai-chat");
  nextTick(() => aiChatRef.value?.sendMessage(GENERATE_RUNNING_ORDER_PROMPT));
}

function tabForSection(section) {
  const sectionTabs = {
    running_order:"running-order",
    vips:"vip-list",
    seating:"seating",
  };

  return sectionTabs[section];
}

function handleEventUpdated(update) {
  const updatedEvent = update?.event || update;
  const targetTab = tabForSection(update?.command?.target?.section);

  emit("event-updated", updatedEvent);
  emit("toast", "Event updated from AI command");

  if (targetTab) {
    switchTab(targetTab);
  }
}
</script>


<template>
  <div id="workspace-view" class="active">
    <SourcesPanel :sources="event.sources" @upload="handleUpload" />

    <div id="center-panel">
      <div class="workspace-header">
        <div class="workspace-title">{{ wsTitle }}</div>
        <div class="workspace-sub">{{ wsSub }}</div>
      </div>

      <div class="module-tabs">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="module-tab"
          :class="{ active: activeTab === t.id }"
          type="button"
          @click="switchTab(t.id)"
        >
          <i class="ti" :class="t.icon"></i> {{ t.label }}
        </button>
      </div>

      <div class="module-content" :class="{ active: activeTab === 'running-order' }">
        <RunningOrderTab :rows="event.running_order" :sources="event.sources" @generate="handleGenerateRunningOrder" />
      </div>

      <div class="module-content" :class="{ active: activeTab === 'vip-list' }">
        <VipListTab :vips="event.vips" />
      </div>

      <div class="module-content" :class="{ active: activeTab === 'seating' }">
        <SeatingTab :seating="event.seating" />
      </div>

      <div class="module-content" :class="{ active: activeTab === 'rsvp' }">
        <RsvpTab :event="event" @toast="(msg) => emit('toast', msg)" />
      </div>

      <div class="module-content" :class="{ 'chat-active': activeTab === 'ai-chat', active: activeTab === 'ai-chat' }">
        <AiChatTab
          ref="aiChatRef"
          :event="event"
          :username="username"
          @event-updated="handleEventUpdated"
        />
      </div>
    </div>

    <ModulesPanel :event="event" :active-tab="activeTab" @select="switchTab" />
  </div>
</template>
