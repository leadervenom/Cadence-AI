<script setup>
import { onMounted, ref, watch } from "vue";
import AuthScreen from "./components/AuthScreen.vue";
import AcceptInviteScreen from "./components/AcceptInviteScreen.vue";
import TopBar from "./components/TopBar.vue";
import EventsView from "./components/EventsView.vue";
import WorkspaceView from "./components/WorkspaceView.vue";
import CreateEventModal from "./components/CreateEventModal.vue";
import InviteOrganizerModal from "./components/InviteOrganizerModal.vue";
import ToastNotification from "./components/ToastNotification.vue";
import api from "./services/api.js";
import { isAuthed, logout as clearSession } from "./services/authStore.js";

const currentUser = ref(null);
const events = ref([]);
const currentEvent = ref(null);
const modalOpen = ref(false);
const restoringSession = ref(true);

const inviteToken = ref(new URLSearchParams(window.location.search).get("invite"));
const inviteModalOpen = ref(false);
const inviteEventId = ref(null);

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
  if (inviteToken.value) clearInviteTokenFromUrl();
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

function openInviteModal(eventId) {
  inviteEventId.value = eventId;
  inviteModalOpen.value = true;
}

function closeInviteModal() {
  inviteModalOpen.value = false;
  inviteEventId.value = null;
}

async function handleInviteOrganizer(email) {
  try {
    const result = await api.events.inviteOrganizer(inviteEventId.value, email);
    showToast(result.status === "assigned" ? `${email} added to this event` : `Invite sent to ${email}`);
    inviteModalOpen.value = false;
    inviteEventId.value = null;
  } catch (err) {
    showToast("Could not invite organizer: " + err.message);
  }
}

function handleInviteOrganizerError(msg) {
  showToast(msg);
}

function clearInviteTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  window.history.replaceState({}, "", url);
  inviteToken.value = null;
}


/*
  Receives updates from AI.

  Backend already applies the change and returns:
  {
    event: updatedEvent,
    command: {...}
  }
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

  <AcceptInviteScreen
    v-else-if="!currentUser && inviteToken"
    :token="inviteToken"
    @login="handleLogin"
    @login-error="handleLoginError"
  />

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
        :role="currentUser.role"
        @open-event="openEvent"
        @create-event-click="openCreateModal"
        @invite-organizer="openInviteModal"
      />


      <WorkspaceView
        v-else
        :event="currentEvent"
        :username="currentUser.fullName"
        :role="currentUser.role"
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


  <InviteOrganizerModal
    :open="inviteModalOpen"
    @close="closeInviteModal"
    @invite="handleInviteOrganizer"
    @invite-error="handleInviteOrganizerError"
  />


  <ToastNotification
    :message="toastMessage"
    :visible="toastVisible"
  />

</template>