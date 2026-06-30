<script setup>
defineProps({
  message: { type: String, default: "" },
  visible: { type: Boolean, default: false },
});
</script>

<template>
  <div id="toast" :class="{ show: visible }">
    <i class="ti ti-check"></i> <span>{{ message }}</span>
  </div>
</template>
