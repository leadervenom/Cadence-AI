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

const props = defineProps({
  event: { type: Object, required: true },
  username: { type: String, default: "You" },
});
const emit = defineEmits(["toast"]);

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
  "ai-chat": { title: "AI Assistant", sub: () => "Event intelligence powered by Claude" },
};

const wsTitle = computed(() => headerLabels[activeTab.value]?.title || "");
const wsSub = computed(() => headerLabels[activeTab.value]?.sub() || "");

const showEmergencyBar = computed(
  () => activeTab.value === "running-order" && props.event.status === "live"
);

function switchTab(tab) {
  activeTab.value = tab;
}

function handleUpload() {
  const names = ["Protocol_Brief_2026.pdf", "VIP_List_Updated.xlsx", "Floor_Plan_Rev2.pdf"];
  const name = names[Math.floor(Math.random() * names.length)];
  const newSource = { name, size: Math.floor(Math.random() * 900 + 50) + "KB", status: "processing", type: "pdf" };
  props.event.sources.unshift(newSource);
  emit("toast", "Uploading " + name);
  setTimeout(() => {
    newSource.status = "parsed";
    emit("toast", name + " parsed");
  }, 2500);
}

function handleBroadcast(msg) {
  emit("toast", "Broadcast sent to all operators");
  switchTab("ai-chat");
  aiChatRef.value?.pushEmergencyMessage(msg);
}

function handleEmergencyError(msg) {
  emit("toast", msg);
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
        <AiChatTab v-if="activeTab === 'ai-chat'" ref="aiChatRef" :event="event" :username="username" />
      </div>

      <EmergencyBar v-if="showEmergencyBar" @broadcast="handleBroadcast" @error="handleEmergencyError" />
    </div>

    <ModulesPanel :event="event" :active-tab="activeTab" @select="switchTab" />
  </div>
</template>
