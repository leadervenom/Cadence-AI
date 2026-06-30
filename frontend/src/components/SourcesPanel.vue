<script setup>
import { ref } from "vue";

const props = defineProps({
  sources: { type: Array, required: true },
});
const emit = defineEmits(["upload"]);

const activeIndex = ref(0);
const fileInput = ref(null);

function selectSource(i) {
  activeIndex.value = i;
}

function iconFor(type) {
  if (type === "pdf") return "ti-file-type-pdf";
  if (type === "docx") return "ti-file-word";
  return "ti-file-spreadsheet";
}

function openPicker() {
  fileInput.value?.click();
}

function emitFiles(fileList) {
  const files = Array.from(fileList || []);
  if (files.length) emit("upload", files);
}

function handleFileChange(event) {
  emitFiles(event.target.files);
  event.target.value = "";
}

function handleDrop(event) {
  emitFiles(event.dataTransfer.files);
}
</script>

<template>
  <div id="left-panel">
    <div class="panel-header">
      <div class="panel-label">Sources</div>
      <div class="panel-count">{{ sources.length }} documents</div>
    </div>
    <div class="drop-zone" @click="openPicker" @dragover.prevent @drop.prevent="handleDrop">
      <i class="ti ti-upload"></i>
      <p>Drop files here or <span>browse</span></p>
      <div class="file-types">PDF, DOCX, TXT, JSON, CSV, XLSX</div>
      <input
        ref="fileInput"
        type="file"
        multiple
        hidden
        accept=".pdf,.json,.xlsx,.csv,.txt,.docx"
        @change="handleFileChange"
      >
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
