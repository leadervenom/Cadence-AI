<script setup>
import { ref, watch } from "vue";
import api from "../services/api.js";

const props = defineProps({
  event: { type: Object, required: true },
});
const emit = defineEmits(["toast"]);

const searchQuery = ref("");
const searchResults = ref([]);
const searching = ref(false);
const participants = ref([]);
const loadingParticipants = ref(false);
const pendingEmailFor = ref(null);
const emailInput = ref("");
let searchTimer = null;

async function loadParticipants() {
  if (!props.event?.id) return;
  loadingParticipants.value = true;
  try {
    participants.value = await api.events.getParticipants(props.event.id);
  } catch (err) {
    emit("toast", "Could not load participants");
  } finally {
    loadingParticipants.value = false;
  }
}

watch(() => props.event?.id, loadParticipants, { immediate: true });

watch(searchQuery, (q) => {
  clearTimeout(searchTimer);
  const trimmed = q.trim();

  if (!trimmed) {
    searchResults.value = [];
    return;
  }

  searchTimer = setTimeout(async () => {
    searching.value = true;
    try {
      searchResults.value = await api.vips.search(trimmed);
    } catch (err) {
      emit("toast", "Search failed");
    } finally {
      searching.value = false;
    }
  }, 300);
});

function initials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("");
}

function capitalize(s) {
  return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
}

function openMailto(participant, acceptUrl, declineUrl) {
  const subject = `Invitation: ${props.event.name}`;
  const details = [
    props.event.date ? `Date: ${props.event.date}` : null,
    props.event.venue ? `Venue: ${props.event.venue}` : null,
  ].filter(Boolean).join("\n");

  const body =
    `Dear ${participant.full_name},\n\n` +
    `You are invited to ${props.event.name}.\n` +
    (details ? `${details}\n\n` : "\n") +
    `Please confirm your attendance using one of the links below:\n\n` +
    `Accept: ${acceptUrl}\n` +
    `Decline: ${declineUrl}\n\n` +
    `Regards,\nCadence AI Event Operations`;

  const link = document.createElement("a");
  link.href = `mailto:${encodeURIComponent(participant.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  link.click();
}

async function sendInvite(vip, email = null) {
  try {
    const { participant, acceptUrl, declineUrl } = await api.events.invite(props.event.id, {
      vipId: vip.vip_id,
      role: vip.position_title,
      email,
    });

    openMailto(participant, acceptUrl, declineUrl);

    emit("toast", `Invite drafted for ${participant.full_name}`);
    pendingEmailFor.value = null;
    emailInput.value = "";
    await loadParticipants();
  } catch (err) {
    emit("toast", err.message || "Could not invite participant");
  }
}

function handleInviteClick(vip) {
  if (!vip.email) {
    pendingEmailFor.value = vip.vip_id;
    return;
  }
  sendInvite(vip);
}

function confirmEmailAndInvite(vip) {
  const email = emailInput.value.trim();
  if (!email) return;
  sendInvite(vip, email);
}
</script>

<template>
  <div class="rsvp-tab">
    <div class="rsvp-search">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search participants or VIPs by name, title, or email…"
        class="form-input"
      >
    </div>

    <div v-if="searchQuery.trim()" class="rsvp-results">
      <div v-if="searching" class="rsvp-empty">Searching…</div>
      <div v-else-if="!searchResults.length" class="rsvp-empty">No matches found.</div>

      <div v-for="vip in searchResults" :key="vip.vip_id" class="vip-card">
        <div class="vip-avatar" :class="vip.vip_category">{{ initials(vip.full_name) }}</div>
        <div class="vip-info">
          <div class="vip-rank">{{ (vip.vip_category || "").toUpperCase() }}</div>
          <div class="vip-name">{{ vip.full_name }}</div>
          <div class="vip-title">{{ vip.position_title }}</div>
          <div class="vip-title">{{ vip.email || "No email on file" }}</div>
        </div>

        <div v-if="pendingEmailFor === vip.vip_id" class="rsvp-email-prompt">
          <input type="email" v-model="emailInput" placeholder="Enter their email…" class="form-input">
          <button class="btn-primary" type="button" @click="confirmEmailAndInvite(vip)">Send</button>
        </div>
        <button v-else class="btn-primary" type="button" @click="handleInviteClick(vip)">Invite</button>
      </div>
    </div>

    <div class="rsvp-participants">
      <div class="panel-label">Registered Participants</div>
      <div v-if="loadingParticipants" class="rsvp-empty">Loading…</div>
      <div v-else-if="!participants.length" class="rsvp-empty">No one invited yet — search above to invite participants or VIPs.</div>

      <div v-for="p in participants" :key="p.event_vip_id" class="vip-card">
        <div class="vip-avatar" :class="p.vip_category">{{ initials(p.full_name) }}</div>
        <div class="vip-info">
          <div class="vip-rank">{{ p.event_role || (p.vip_category || "").toUpperCase() }}</div>
          <div class="vip-name">{{ p.full_name }}</div>
          <div class="vip-title">{{ p.position_title }}</div>
          <span class="vip-status-badge" :class="p.attendance_status">{{ capitalize(p.attendance_status) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
