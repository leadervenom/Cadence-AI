<script setup>
defineProps({
  traffic: { type: Object, required: true },
});

function nodeClass(route, i) {
  if (i === 0) return "start";
  if (i === route.length - 1) return "end";
  return "checkpoint";
}
</script>

<template>
  <div class="traffic-map">
    <div style="font-size:13px;font-weight:600;color:var(--text-secondary);align-self:flex-start;margin-bottom:4px">Convoy Route</div>
    <div class="traffic-route">
      <template v-for="(r, i) in traffic.route" :key="i">
        <div class="traffic-node" :class="nodeClass(traffic.route, i)">{{ r }}</div>
        <i v-if="i < traffic.route.length - 1" class="ti ti-arrow-right traffic-arrow"></i>
      </template>
    </div>
    <div class="eta-cards">
      <div class="eta-card">
        <div class="eta-label">ETA</div>
        <div class="eta-value">{{ traffic.eta_mins }}<span style="font-size:14px;font-weight:400;color:var(--text-secondary)"> min</span></div>
        <div class="eta-sub">Estimated arrival</div>
      </div>
      <div class="eta-card">
        <div class="eta-label">Distance</div>
        <div class="eta-value">{{ traffic.distance }}</div>
        <div class="eta-sub">Total route</div>
      </div>
      <div class="eta-card">
        <div class="eta-label">Convoy</div>
        <div class="eta-value">{{ traffic.convoy_size }}<span style="font-size:14px;font-weight:400;color:var(--text-secondary)"> vehicles</span></div>
        <div class="eta-sub">Escort size</div>
      </div>
    </div>
  </div>
</template>
