<script setup>
import { computed, ref } from "vue";
import SourcesPanel from "./SourcesPanel.vue";
import RunningOrderTab from "./RunningOrderTab.vue";
import VipListTab from "./VipListTab.vue";
import SeatingTab from "./SeatingTab.vue";
import TrafficTab from "./TrafficTab.vue";
import AiChatTab from "./AiChatTab.vue";
import EmergencyBar from "./EmergencyBar.vue";
import ModulesPanel from "./ModulesPanel.vue";
import api from "../services/api.js";

const props = defineProps({
  event: { type: Object, required: true },
  username: { type: String, default: "You" },
  offline: { type: Boolean, default: false },
});
const emit = defineEmits(["toast", "event-updated"]);

const activeTab = ref("running-order");
const aiChatRef = ref(null);

const tabs = [
  { id: "running-order", icon: "ti-timeline", label: "Running Order" },
  { id: "vip-list", icon: "ti-users", label: "VIP List" },
  { id: "seating", icon: "ti-layout-rows", label: "Seating" },
  { id: "traffic", icon: "ti-car", label: "Traffic" },
  { id: "ai-chat", icon: "ti-sparkles", label: "AI Assistant" },
];

const headerLabels = {
  "running-order": { title: "Running Order Timeline", sub: () => "Live event schedule — " + props.event.name },
  "vip-list": { title: "VIP Management", sub: () => "Guest list & protocol hierarchy" },
  seating: { title: "Seating Layout", sub: () => "Floor plan & seat assignments" },
  traffic: { title: "Traffic & Motorcade", sub: () => "Convoy tracking & ETA" },
  "ai-chat": { title: "AI Assistant", sub: () => "Event intelligence powered by Gemini" },
};

const wsTitle = computed(() => headerLabels[activeTab.value]?.title || "");
const wsSub = computed(() => headerLabels[activeTab.value]?.sub() || "");

const showEmergencyBar = computed(
  () => activeTab.value === "running-order" && props.event.status === "live"
);

function switchTab(tab) {
  activeTab.value = tab;
}

function fileType(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext || file.type || "file";
}

function fileSize(file) {
  if (file.size < 1024) return `${file.size} B`;
  if (file.size < 1024 * 1024) return `${Math.round(file.size / 1024)} KB`;
  return `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
}

function readJsonFile(file) {
  return readFileText(file).then((text) => JSON.stringify(JSON.parse(text), null, 2));
}

function readCsvFile(file) {
  return readFileText(file).then((text) => text.trim());
}

function readFileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

async function handleUpload(files) {
  for (const file of files) {
    const pendingSource = {
      name: file.name,
      size: fileSize(file),
      status: "processing",
      type: fileType(file),
    };
    props.event.sources.unshift(pendingSource);
    emit("toast", "Uploading " + file.name);

    try {
      const type = fileType(file);
      let text = "";
      let generatedRows = null;
      let generatedVips = null;

      if (props.offline) {
        text = await readFileText(file);
      } else if (["pdf", "docx", "txt", "json", "csv", "xlsx"].includes(type)) {
        emit("toast", "Parsing " + file.name + " with Gemini");
        const basePayload = {
          filename: file.name,
          content_base64: await readFileBase64(file),
        };
        const parsed = await api.ai.extractProtocol(basePayload);
        text = parsed.text || "";
        generatedRows = parsed.running_order || null;
        generatedVips = parsed.vips || null;
      } else if (type === "json") {
        text = await readJsonFile(file);
      } else if (type === "csv") {
        text = await readCsvFile(file);
      } else {
        text = await readFileText(file);
      }

      if (props.offline) {
        pendingSource.status = "parsed";
      } else {
        await api.events.uploadDocument(props.event.id, {
          name: file.name,
          type,
          size: fileSize(file),
          category: "other",
          text,
        });
        if (generatedRows?.length) {
          await api.events.updateExtraction(props.event.id, "running_order", generatedRows);
        }
        if (generatedVips?.length) {
          await api.events.updateVips(props.event.id, generatedVips);
        }
        const updatedEvent = await api.events.get(props.event.id);
        emit("event-updated", updatedEvent);
      }
      if (generatedRows?.length || generatedVips?.length) {
        emit("toast", `${file.name} parsed into running order and guest list`);
      } else {
        emit("toast", file.name + " uploaded");
      }
    } catch (err) {
      pendingSource.status = "failed";
      emit("toast", err.message || "Upload failed");
    }
  }
}

function handleBroadcast(msg) {
  emit("toast", "Broadcast sent to all operators");
  switchTab("ai-chat");
  aiChatRef.value?.pushEmergencyMessage(msg);
}

function handleEmergencyError(msg) {
  emit("toast", msg);
}

function handleAiEventUpdated(updatedEvent) {
  emit("event-updated", updatedEvent);
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
        <RunningOrderTab :rows="event.running_order" />
      </div>

      <div class="module-content" :class="{ active: activeTab === 'vip-list' }">
        <VipListTab :vips="event.vips" />
      </div>

      <div class="module-content" :class="{ active: activeTab === 'seating' }">
        <SeatingTab :seating="event.seating" />
      </div>

      <div class="module-content" :class="{ active: activeTab === 'traffic' }">
        <TrafficTab :traffic="event.traffic" />
      </div>

      <div class="module-content" :class="{ 'chat-active': activeTab === 'ai-chat', active: activeTab === 'ai-chat' }">
        <AiChatTab
          ref="aiChatRef"
          :event="event"
          :username="username"
          :active="activeTab === 'ai-chat'"
          :offline="offline"
          @toast="emit('toast', $event)"
          @event-updated="handleAiEventUpdated"
        />
      </div>

      <EmergencyBar v-if="showEmergencyBar" @broadcast="handleBroadcast" @error="handleEmergencyError" />
    </div>

    <ModulesPanel :event="event" :active-tab="activeTab" @select="switchTab" />
  </div>
</template>
