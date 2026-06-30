<script setup>
defineProps({
  vips: { type: Array, required: true },
});

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("");
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
</script>

<template>
  <div class="vip-grid">
    <div v-for="(v, i) in vips" :key="i" class="vip-card">
      <div class="vip-avatar" :class="v.category">{{ initials(v.name) }}</div>
      <div class="vip-info">
        <div class="vip-rank">#{{ v.rank }} — {{ v.category.toUpperCase() }}</div>
        <div class="vip-name">{{ v.name }}</div>
        <div class="vip-title">{{ v.title }}</div>
        <span class="vip-status-badge" :class="v.status">{{ capitalize(v.status) }}</span>
      </div>
    </div>
  </div>
</template>
