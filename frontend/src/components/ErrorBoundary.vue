<script setup>
import { onErrorCaptured, ref } from "vue";

const props = defineProps({
  label: { type: String, default: "This module" },
});

const error = ref(null);

onErrorCaptured((err, instance, info) => {
  console.error(`${props.label} crashed:`, err, info);
  error.value = err;
  return false;
});

function reset() {
  error.value = null;
}
</script>

<template>
  <div v-if="error" class="error-boundary-fallback">
    <i class="ti ti-alert-triangle"></i>
    <p>{{ label }} hit an error and couldn't load.</p>
    <button class="btn-secondary" type="button" @click="reset">Try again</button>
  </div>
  <slot v-else />
</template>
