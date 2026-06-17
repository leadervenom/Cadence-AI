<script setup>
defineProps({
  event: { type: Object, required: true },
});
defineEmits(["open"]);

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
</script>

<template>
  <div class="event-card" @click="$emit('open', event.id)">
    <div class="event-card-top">
      <span class="status-badge" :class="event.status">
        <span class="status-dot"></span>
        {{ capitalize(event.status) }}
      </span>
      <i class="ti ti-chevron-right card-arrow"></i>
    </div>
    <h3>{{ event.name }}</h3>
    <div class="event-desc">{{ event.type }}</div>
    <div class="event-meta">
      <span><i class="ti ti-calendar" style="font-size:12px"></i> {{ event.date }}</span>
      <span class="meta-dot">·</span>
      <span><i class="ti ti-map-pin" style="font-size:12px"></i> {{ event.venue }}</span>
      <span class="meta-dot">·</span>
      <span>{{ event.docs }} docs</span>
    </div>
  </div>
</template>
