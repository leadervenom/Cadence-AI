<script setup>
defineProps({
  seating: { type: Object, required: true },
});
</script>

<template>
  <div class="seating-canvas">
    <div class="stage-label">— Stage / Podium —</div>
    <div v-for="(row, ri) in seating.rows" :key="ri" class="seating-row">
      <div v-for="(seat, si) in row" :key="si" class="seat" :class="seat.cat">{{ seat.label }}</div>
    </div>
  </div>
</template>
