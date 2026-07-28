<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  vips: { type: Array, default: () => [] },
  style: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["assign-vip", "assign-freeform", "clear", "close"]);

const CATEGORIES = ["royalty", "vvip", "vip", "official", "guest"];

const query = ref("");
const freeformName = ref("");
const freeformCat = ref("guest");

const matches = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.vips.slice(0, 6);
  return props.vips.filter((v) => (v.name || "").toLowerCase().includes(q)).slice(0, 6);
});

function pick(vip) {
  emit("assign-vip", vip.id);
}

function setFreeform() {
  const name = freeformName.value.trim();
  if (!name) return;
  emit("assign-freeform", { name, cat: freeformCat.value });
}
</script>

<template>
  <div class="seat-popover" :style="style" @pointerdown.stop>
    <div class="ai-input-bar" style="padding: 0; margin: 0; background: none; border: none; gap: 6px;">
      <input
        v-model="query"
        type="text"
        class="form-input"
        placeholder="Search VIP list..."
        autofocus
      />
      <button class="btn-icon" type="button" title="Close" @click="emit('close')">
        <i class="ti ti-x"></i>
      </button>
    </div>

    <div class="seat-popover-results">
      <button
        v-for="v in matches"
        :key="v.id"
        type="button"
        class="seat-popover-option"
        @click="pick(v)"
      >
        <span>{{ v.name }}</span>
        <span class="vip-title">{{ v.category }}</span>
      </button>
      <div v-if="!matches.length" class="seat-popover-empty">No matching VIPs.</div>
    </div>

    <div style="display: flex; gap: 6px;">
      <input
        v-model="freeformName"
        type="text"
        class="form-input"
        placeholder="Or type a name (press, staff...)"
        @keyup.enter="setFreeform"
      />
    </div>
    <div style="display: flex; gap: 6px; align-items: center;">
      <select v-model="freeformCat" class="form-input" style="flex: 1;">
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
      </select>
      <button class="btn-secondary" type="button" @click="setFreeform">Set</button>
    </div>

    <button class="seat-popover-clear" type="button" @click="emit('clear')">Clear this seat</button>
  </div>
</template>
