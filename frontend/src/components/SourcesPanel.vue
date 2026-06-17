<script setup>
import { ref } from "vue";

const props = defineProps({
  sources: { type: Array, required: true },
});
const emit = defineEmits(["upload"]);

const activeIndex = ref(0);

function selectSource(i) {
  activeIndex.value = i;
}

function iconFor(type) {
  if (type === "pdf") return "ti-file-type-pdf";
  if (type === "docx") return "ti-file-word";
  return "ti-file-spreadsheet";
}

function simulateUpload() {
  emit("upload");
}
</script>

<template>
  <div id="left-panel">
    <div class="panel-header">
      <div class="panel-label">Sources</div>
      <div class="panel-count">{{ sources.length }} documents</div>
    </div>
    <div class="drop-zone" @click="simulateUpload">
      <i class="ti ti-upload"></i>
      <p>Drop files here or <span>browse</span></p>
      <div class="file-types">PDF, JSON, XLSX</div>
    </div>
    <div class="sources-list">
      <div
        v-for="(s, i) in sources"
        :key="s.name + i"
        class="source-item"
        :class="{ active: i === activeIndex }"
        @click="selectSource(i)"
      >
        <i :class="['ti', iconFor(s.type), 'source-icon']"></i>
        <div class="source-info">
          <div class="source-name" :title="s.name">{{ s.name }}</div>
          <span class="source-badge" :class="s.status">{{ s.status.toUpperCase() }}</span>
        </div>
        <div class="source-size">{{ s.size }}</div>
      </div>
    </div>
  </div>
</template>
