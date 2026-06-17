<script setup>
const props = defineProps({
  event: { type: Object, required: true },
  activeTab: { type: String, required: true },
});
const emit = defineEmits(["select"]);

const modules = [
  { id: "running-order", icon: "ti-timeline", title: "Running Order", sub: "Timeline & schedule cues" },
  { id: "vip-list", icon: "ti-users", title: "VIP Management", sub: "Guest list & protocol" },
  { id: "seating", icon: "ti-layout-rows", title: "Seating Layout", sub: "Floor plan & assignments" },
  { id: "traffic", icon: "ti-car", title: "Traffic & Motorcade", sub: "Convoy tracking & ETA" },
  { id: "ai-chat", icon: "ti-sparkles", title: "AI Assistant", sub: "Event intelligence" },
];

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
</script>

<template>
  <div id="right-panel">
    <div class="right-panel-header">
      <div class="panel-label">Modules</div>
      <div class="panel-count">Select operational view</div>
    </div>

    <div class="event-info-section">
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">{{ event.date }}</span></div>
      <div class="info-row"><span class="info-label">Venue</span><span class="info-value" style="max-width:110px;text-align:right">{{ event.venue }}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="status-badge" :class="event.status" style="font-size:10px">{{ capitalize(event.status) }}</span></div>
      <div class="info-row"><span class="info-label">Sources</span><span class="info-value">{{ event.sources.length }} docs</span></div>
      <div class="info-row" style="border:none"><span class="info-label">VIPs</span><span class="info-value">{{ event.vips.length }} guests</span></div>
    </div>

    <div class="modules-list">
      <div
        v-for="m in modules"
        :key="m.id"
        class="module-btn"
        :class="{ active: activeTab === m.id }"
        @click="$emit('select', m.id)"
      >
        <div class="module-btn-icon"><i class="ti" :class="m.icon"></i></div>
        <div class="module-btn-title">{{ m.title }}</div>
        <div class="module-btn-sub">{{ m.sub }}</div>
      </div>
    </div>
  </div>
</template>
