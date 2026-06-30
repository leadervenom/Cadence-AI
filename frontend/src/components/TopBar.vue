<script setup>
defineProps({
  currentUser: { type: Object, default: null },
  currentEvent: { type: Object, default: null },
});
defineEmits(["logout", "back"]);
</script>

<template>
  <div id="topbar">
    <div class="topbar-logo">
      <div class="topbar-icon"><i class="ti ti-shield-check"></i></div>
      <span class="topbar-name">Cadence</span>
    </div>
    <span class="topbar-sep">·</span>

    <span v-if="!currentEvent" class="topbar-ctx">Event Operations Hub</span>
    <span v-else class="topbar-ctx">
      <button class="back-btn" type="button" @click="$emit('back')">
        <i class="ti ti-arrow-left" style="font-size:14px"></i> Back
      </button>
      <span style="color:var(--text-muted);margin:0 6px">·</span>
      {{ currentEvent.name }}
      <span v-if="currentEvent.status === 'live'" class="status-badge live" style="margin-left:10px;font-size:11px">
        <span class="status-dot"></span> LIVE
      </span>
    </span>

    <div class="topbar-right">
      <div class="conn-badge" :style="{ display: currentEvent?.status === 'live' ? 'flex' : 'none' }">
        <span class="conn-dot"></span> CONNECTED
      </div>
      <span class="topbar-role">{{ currentUser ? `${currentUser.username} · ${currentUser.role}` : "" }}</span>
      <button class="btn-icon" type="button" @click="$emit('logout')">
        <i class="ti ti-logout" style="font-size:14px"></i> Sign out
      </button>
    </div>
  </div>
</template>
