<script setup>
import { onMounted, ref } from "vue";
import AuthScreen from "./components/AuthScreen.vue";
import TopBar from "./components/TopBar.vue";
import EventsView from "./components/EventsView.vue";
import WorkspaceView from "./components/WorkspaceView.vue";
import CreateEventModal from "./components/CreateEventModal.vue";
import ToastNotification from "./components/ToastNotification.vue";
import api from "./services/api.js";
import { createSeedEvents } from "./data/events.js";

const currentUser = ref(null);
const events = ref([]);
const currentEvent = ref(null);
const modalOpen = ref(false);
const usingFallbackData = ref(false);

const toastMessage = ref("");
const toastVisible = ref(false);
let toastTimer = null;

function showToast(msg) {
  toastMessage.value = msg;
  toastVisible.value = true;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
  }, 2800);
}

function handleLogin(user) {
  currentUser.value = user;
}

function handleLoginError(msg) {
  showToast(msg);
}

function handleLogout() {
  currentUser.value = null;
  currentEvent.value = null;
}

async function loadEvents() {
  try {
    events.value = await api.events.list();
    usingFallbackData.value = false;
  } catch (err) {
    events.value = createSeedEvents();
    usingFallbackData.value = true;
    showToast("Backend unavailable. Showing local demo data.");
  }
}

async function openEvent(id) {
  if (usingFallbackData.value) {
    currentEvent.value = events.value.find((e) => e.id === id) || null;
    return;
  }

  try {
    currentEvent.value = await api.events.get(id);
  } catch (err) {
    showToast(err.message || "Unable to load event");
  }
}

function goBack() {
  currentEvent.value = null;
}

function openCreateModal() {
  modalOpen.value = true;
}

function closeCreateModal() {
  modalOpen.value = false;
}

async function handleCreateEvent(form) {
  try {
    const newEvent = usingFallbackData.value
      ? {
          id: events.value.length ? Math.max(...events.value.map((e) => e.id)) + 1 : 1,
          name: form.name,
          type: form.type || "New Event",
          date: form.date || "TBD",
          venue: form.venue || "TBD",
          status: form.status || "draft",
          docs: 0,
          running_order: [],
          vips: [],
          sources: [],
          seating: { rows: [] },
          traffic: { route: [], eta_mins: 0, distance: "", convoy_size: 0 },
          ai_context: `You are Cadence AI for ${form.name}. Help with event planning and operations.`,
        }
      : await api.events.create(form);

    events.value.unshift(newEvent);
    modalOpen.value = false;
    currentEvent.value = newEvent;
    showToast(`Event "${form.name}" created`);
  } catch (err) {
    showToast(err.message || "Unable to create event");
  }
}

function handleCreateEventError(msg) {
  showToast(msg);
}

function handleEventUpdated(updatedEvent) {
  currentEvent.value = updatedEvent;
  const index = events.value.findIndex((event) => event.id === updatedEvent.id);
  if (index >= 0) events.value[index] = updatedEvent;
}

onMounted(loadEvents);
</script>

<template>
  <AuthScreen v-if="!currentUser" @login="handleLogin" @login-error="handleLoginError" />

  <div v-else id="app-shell" class="active">
    <TopBar :current-user="currentUser" :current-event="currentEvent" @logout="handleLogout" @back="goBack" />

    <div id="main">
      <EventsView
        v-if="!currentEvent"
        :events="events"
        @open-event="openEvent"
        @create-event-click="openCreateModal"
      />
      <WorkspaceView
        v-else
        :event="currentEvent"
        :username="currentUser.username"
        :offline="usingFallbackData"
        @toast="showToast"
        @event-updated="handleEventUpdated"
      />
    </div>
  </div>

  <CreateEventModal
    :open="modalOpen"
    @close="closeCreateModal"
    @create="handleCreateEvent"
    @create-error="handleCreateEventError"
  />

  <ToastNotification :message="toastMessage" :visible="toastVisible" />
</template>
