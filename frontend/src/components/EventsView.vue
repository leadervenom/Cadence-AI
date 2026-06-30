<script setup>
import { computed, ref } from "vue";
import EventCard from "./EventCard.vue";

const props = defineProps({
  events: { type: Array, required: true },
});
const emit = defineEmits(["open-event", "create-event-click"]);

const search = ref("");

const filteredEvents = computed(() => {
  const q = search.value.toLowerCase();
  return props.events.filter(
    (e) => e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)
  );
});
</script>

<template>
  <div id="events-view" class="active">
    <div class="events-header">
      <h1>Events</h1>
      <p>Select an event to open its command workspace.</p>
    </div>
    <div class="events-top-bar">
      <div class="search-wrap">
        <i class="ti ti-search"></i>
        <input type="text" placeholder="Search events…" v-model="search">
      </div>
      <button class="btn-new" type="button" @click="$emit('create-event-click')">
        <i class="ti ti-plus" style="font-size:15px"></i> New Event
      </button>
    </div>
    <div class="events-grid">
      <EventCard
        v-for="ev in filteredEvents"
        :key="ev.id"
        :event="ev"
        @open="(id) => $emit('open-event', id)"
      />
    </div>
    <div v-if="!filteredEvents.length" class="empty-state" style="grid-column:1/-1">
      <i class="ti ti-search"></i>
      <p>No events found</p>
    </div>
  </div>
</template>
