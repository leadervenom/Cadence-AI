<script setup>
import { computed } from "vue";

const props = defineProps({
  rows: { type: Array, required: true },
  sources: { type: Array, default: () => [] },
});
defineEmits(["generate"]);

const hasParsedContent = computed(() => props.sources.some((s) => s.content));
</script>

<template>
  <div class="ro-tab">
    <div class="ro-tab-header">
      <button
        class="btn-primary"
        type="button"
        :disabled="!hasParsedContent"
        :title="hasParsedContent ? '' : 'Upload and parse a source document first'"
        @click="$emit('generate')"
      >
        <i class="ti ti-sparkles" style="font-size:14px"></i> Generate from Documents
      </button>
    </div>

    <table class="ro-table">
      <thead>
        <tr>
          <th style="width:110px">TIME</th>
          <th style="width:48px">DUR</th>
          <th>ACTIVITY</th>
          <th style="width:180px">ROLE</th>
          <th style="width:90px">STATUS</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="row.id || i" :class="{ 'row-on-air': row.status === 'on-air' }">
          <td class="time-col">{{ row.time }}</td>
          <td class="dur-col">{{ row.dur }}</td>
          <td>
            <div class="activity-name">{{ row.activity }}</div>
            <div class="activity-loc">{{ row.loc }}</div>
          </td>
          <td class="role-col">{{ row.role }}</td>
          <td><span class="row-status" :class="row.status">{{ row.status.replace('-', ' ').toUpperCase() }}</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
