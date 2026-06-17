<script setup>
import { ref } from "vue";
import AuthScreen from "./components/AuthScreen.vue";
import TopBar from "./components/TopBar.vue";
import EventsView from "./components/EventsView.vue";
import WorkspaceView from "./components/WorkspaceView.vue";
import CreateEventModal from "./components/CreateEventModal.vue";
import ToastNotification from "./components/ToastNotification.vue";
import { createSeedEvents } from "./data/events.js";

const currentUser = ref(null);
const events = ref(createSeedEvents());
const currentEvent = ref(null);
const modalOpen = ref(false);

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

function openEvent(id) {
  currentEvent.value = events.value.find((e) => e.id === id) || null;
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

function handleCreateEvent(form) {
  const newEvent = {
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
    traffic: { route: ["Origin", "Destination"], eta_mins: 0, distance: "—", convoy_size: 0 },
    ai_context: `You are an AI assistant for ${form.name}. Help with event planning and operations.`,
  };
  events.value.unshift(newEvent);
  modalOpen.value = false;
  showToast(`Event "${form.name}" created`);
}

function handleCreateEventError(msg) {
  showToast(msg);
}
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
        @toast="showToast"
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
