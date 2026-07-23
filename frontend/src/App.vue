<script setup>
import { onMounted, ref, watch } from "vue";
import AuthScreen from "./components/AuthScreen.vue";
import TopBar from "./components/TopBar.vue";
import EventsView from "./components/EventsView.vue";
import WorkspaceView from "./components/WorkspaceView.vue";
import CreateEventModal from "./components/CreateEventModal.vue";
import ToastNotification from "./components/ToastNotification.vue";
import api from "./services/api.js";
import { isAuthed, logout as clearSession } from "./services/authStore.js";

const currentUser = ref(null);
const events = ref([]);
const currentEvent = ref(null);
const modalOpen = ref(false);
const restoringSession = ref(true);

async function loadEvents() {
  try {
    events.value = await api.events.getAll();
  } catch (err) {
    showToast("Could not load events from the server");
  }
}

onMounted(async () => {
  if (isAuthed()) {
    try {
      currentUser.value = await api.auth.me();
    } catch (err) {
      clearSession();
    }
  }
  restoringSession.value = false;
});

watch(currentUser, (user) => {
  if (user) loadEvents();
});

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
  clearSession();
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

async function handleCreateEvent(form) {
  try {
    const newEvent = await api.events.create({
      name: form.name,
      type: form.type || "New Event",
      date: form.date || null,
      venue: form.venue || "TBD",
      status: form.status || "draft",
    });

    events.value.unshift(newEvent);

    modalOpen.value = false;

    showToast(`Event "${form.name}" created`);
  } catch (err) {
    showToast("Could not create event: " + err.message);
  }
}

function handleCreateEventError(msg) {
  showToast(msg);
}


/*
  Receives updates from AI.

  Backend already applies the command and returns:
  {
    event: updatedEvent,
    command: {...}
  }

  Do not run applyEventCommand here.
*/
function handleEventUpdated(update) {
  const updatedEvent = update?.event || update;

  if (!updatedEvent?.id) {
    console.warn("Invalid AI event update:", update);
    return;
  }

  const index = events.value.findIndex(
    (event) => event.id === updatedEvent.id
  );

  if (index >= 0) {
    events.value[index] = {
      ...events.value[index],
      ...updatedEvent,
    };
  }

  currentEvent.value = {
    ...currentEvent.value,
    ...updatedEvent,
  };

  showToast("Event updated from AI command");

  console.log("AI UPDATE RECEIVED:", update);
}
</script>


<template>
  <div v-if="restoringSession"></div>

  <AuthScreen
    v-else-if="!currentUser"
    @login="handleLogin"
    @login-error="handleLoginError"
  />

  <div v-else id="app-shell" class="active">

    <TopBar
      :current-user="currentUser"
      :current-event="currentEvent"
      @logout="handleLogout"
      @back="goBack"
    />


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
        :username="currentUser.fullName"
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


  <ToastNotification
    :message="toastMessage"
    :visible="toastVisible"
  />

</template>