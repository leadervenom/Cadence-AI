<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  seating: { type: Object, required: true },
});

const layouts = computed(() => props.seating.layouts || []);

const activeLayoutId = ref(props.seating.activeLayoutId || layouts.value[0]?.id || null);

watch(layouts, (list) => {
  if (!list.some((l) => l.id === activeLayoutId.value)) {
    activeLayoutId.value = list[0]?.id || null;
  }
});

const activeLayout = computed(
  () => layouts.value.find((l) => l.id === activeLayoutId.value) || layouts.value[0] || null
);

function selectLayout(id) {
  activeLayoutId.value = id;
}
</script>

<template>
  <div class="layouts-tab">
    <div v-if="layouts.length > 1" class="layout-switcher">
      <button
        v-for="l in layouts"
        :key="l.id"
        class="layout-switch-btn"
        :class="{ active: l.id === activeLayout?.id }"
        type="button"
        @click="selectLayout(l.id)"
      >
        {{ l.name }}
      </button>
    </div>

    <div v-if="activeLayout" class="seating-canvas">
      <div class="stage-label">— Stage / Podium —</div>
      <div v-for="(row, ri) in activeLayout.rows" :key="ri" class="seating-row">
        <div v-for="(seat, si) in row" :key="si" class="seat" :class="seat.cat">{{ seat.label }}</div>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="ti ti-layout-rows"></i>
      <p>No layout yet — ask the AI Assistant to create one.</p>
    </div>
  </div>
</template>
