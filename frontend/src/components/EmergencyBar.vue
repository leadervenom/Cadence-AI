<script setup>
import { ref } from "vue";

const emit = defineEmits(["broadcast", "error"]);
const message = ref("");

function handleBroadcast() {
  const trimmed = message.value.trim();
  if (!trimmed) {
    emit("error", "Enter a broadcast message first");
    return;
  }
  emit("broadcast", trimmed);
  message.value = "";
}
</script>

<template>
  <div class="emergency-bar">
    <i class="ti ti-alert-triangle emergency-icon"></i>
    <div style="flex:1">
      <div class="emergency-label">Emergency Runtime Override</div>
      <input
        class="emergency-input"
        v-model="message"
        placeholder="e.g. VVIP Convoy delayed 20 minutes due to traffic on Jalan Skudai…"
        @keydown.enter="handleBroadcast"
      >
    </div>
    <button class="btn-broadcast" type="button" @click="handleBroadcast">Broadcast</button>
  </div>
</template>
