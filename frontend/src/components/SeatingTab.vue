<script setup>
import { computed } from "vue";

const props = defineProps({
  seating: { type: Object, required: true },
});

const layout = computed(() => seatingLayout(props.seating));
const rows = computed(() => {
  if (Array.isArray(props.seating.rows) && props.seating.rows.length) return props.seating.rows;
  if (!Array.isArray(props.seating.seats)) return [];
  return chunkSeats(props.seating.seats, layout.value === "line" ? props.seating.seats.length : 4);
});
const seats = computed(() => rows.value.flat());

function seatingLayout(seating) {
  const value = String(seating?.layout || "forum").toLowerCase();
  return ["circle", "line", "forum"].includes(value) ? value : "forum";
}

function chunkSeats(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function seatStyle(index) {
  if (layout.value !== "circle") return {};
  const total = Math.max(seats.value.length, 1);
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 120;
  return {
    left: `calc(50% + ${Math.cos(angle) * radius}px - 28px)`,
    top: `calc(50% + ${Math.sin(angle) * radius}px - 22px)`,
  };
}
</script>

<template>
  <div class="seating-canvas" :class="'layout-' + layout">
    <div class="stage-label">Stage / Podium</div>

    <div v-if="layout === 'circle'" class="seating-circle">
      <div
        v-for="(seat, i) in seats"
        :key="i"
        class="seat"
        :class="seat.cat"
        :style="seatStyle(i)"
      >
        {{ seat.label }}
      </div>
      <div class="circle-center">Forum floor</div>
    </div>

    <template v-else>
      <div v-for="(row, ri) in rows" :key="ri" class="seating-row">
        <div v-for="(seat, si) in row" :key="si" class="seat" :class="seat.cat">{{ seat.label }}</div>
      </div>
    </template>

    <div v-if="seating.notes" class="seating-notes">
      {{ seating.notes }}
    </div>
  </div>
</template>
