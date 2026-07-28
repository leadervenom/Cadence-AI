<script setup>
import { computed, ref, watch } from "vue";
import api from "../services/api.js";
import SeatingCanvas from "./SeatingCanvas.vue";

const props = defineProps({
  event: { type: Object, required: true },
  role: { type: String, default: "viewer" },
});
const emit = defineEmits(["toast"]);

const readOnly = computed(() => props.role === "viewer");

function cloneLayouts(list) {
  // structuredClone chokes on Vue's reactive Proxy-wrapped arrays
  // ("[object Array] could not be cloned") — JSON round-trip sidesteps
  // that and is safe here since layouts are plain JSON-shaped data.
  return Array.isArray(list) ? JSON.parse(JSON.stringify(list)) : [];
}

// Local, detached copy of event.seating so drag/edit mutations here never
// write directly into the `event` prop (Vue would warn on that) — it only
// flows back out through the debounced PUT below, or gets replaced wholesale
// when a fresher `event.seating` arrives (e.g. the AI just created a layout).
const layouts = ref(cloneLayouts(props.event?.seating?.layouts));
const activeLayoutId = ref(props.event?.seating?.activeLayoutId || layouts.value[0]?.id || null);

watch(
  () => props.event?.seating,
  (seating) => {
    layouts.value = cloneLayouts(seating?.layouts);
    if (!layouts.value.some((l) => l.id === activeLayoutId.value)) {
      activeLayoutId.value = seating?.activeLayoutId || layouts.value[0]?.id || null;
    }
  }
);

const activeLayout = computed(
  () => layouts.value.find((l) => l.id === activeLayoutId.value) || layouts.value[0] || null
);

// A layout created before this rewrite only has `rows` (a flat grid of
// labels, no spatial data) — it keeps rendering via the legacy branch below
// forever; nothing ever writes `rows` again going forward.
const isLegacyLayout = computed(() => activeLayout.value && !activeLayout.value.elements);

function selectLayout(id) {
  activeLayoutId.value = id;
}

// --- autosave ---
const saveState = ref("idle"); // idle | saving | saved
let saveTimer = null;

async function doSave() {
  if (!props.event?.id || readOnly.value) return;
  saveState.value = "saving";
  try {
    await api.seating.update(props.event.id, {
      layouts: layouts.value,
      activeLayoutId: activeLayoutId.value,
    });
    saveState.value = "saved";
    setTimeout(() => {
      if (saveState.value === "saved") saveState.value = "idle";
    }, 1500);
  } catch (err) {
    saveState.value = "idle";
    emit("toast", err.message || "Could not save the seating layout.");
  }
}

function scheduleSave() {
  if (readOnly.value) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 600);
}

watch(layouts, scheduleSave, { deep: true });
watch(activeLayoutId, scheduleSave);

// --- toolbar actions ---
function addTable(type) {
  if (!activeLayout.value || readOnly.value) return;
  const seatCount = type === "round" ? 6 : 4;
  if (!activeLayout.value.elements) activeLayout.value.elements = [];
  activeLayout.value.elements.push({
    id: crypto.randomUUID(),
    type,
    label: type === "round" ? `Table ${activeLayout.value.elements.length + 1}` : "Panel",
    // Stagger new tables so they don't land exactly on top of each other —
    // cascades across a 4-wide grid of drop points, wrapping and drifting
    // down after 16 tables rather than clustering forever in one corner.
    x: 20 + (activeLayout.value.elements.length % 4) * 20,
    y: 20 + (Math.floor(activeLayout.value.elements.length / 4) % 4) * 20,
    rotation: 0,
    seats: Array.from({ length: seatCount }, () => ({ id: crypto.randomUUID(), vipId: null, name: null, cat: null })),
  });
}

// --- inline prompt/confirm (native window.prompt/confirm block the tab's
// whole event loop until manually dismissed, and don't match the app's
// theme — this is a small in-tab replacement scoped to this component,
// not a generic app-wide modal system).
const inlinePrompt = ref(null); // { type: 'text'|'confirm', title, value, confirmLabel, danger, onConfirm }

function confirmInlinePrompt() {
  const p = inlinePrompt.value;
  if (!p) return;
  if (p.type === "text") {
    const trimmed = (p.value || "").trim();
    if (!trimmed) return;
    p.onConfirm(trimmed);
  } else {
    p.onConfirm();
  }
  inlinePrompt.value = null;
}

function cancelInlinePrompt() {
  inlinePrompt.value = null;
}

function addLayout() {
  if (readOnly.value) return;
  inlinePrompt.value = {
    type: "text",
    title: "New layout name",
    value: `Layout ${layouts.value.length + 1}`,
    confirmLabel: "Create",
    onConfirm: (name) => {
      const id = crypto.randomUUID();
      layouts.value.push({ id, name, elements: [] });
      activeLayoutId.value = id;
    },
  };
}

function renameLayout() {
  if (!activeLayout.value || readOnly.value) return;
  const layout = activeLayout.value;
  inlinePrompt.value = {
    type: "text",
    title: "Rename layout",
    value: layout.name,
    confirmLabel: "Save",
    onConfirm: (name) => {
      layout.name = name;
    },
  };
}

function deleteLayout() {
  if (!activeLayout.value || readOnly.value) return;
  const targetId = activeLayout.value.id;
  inlinePrompt.value = {
    type: "confirm",
    title: `Delete layout "${activeLayout.value.name}"? This can't be undone.`,
    confirmLabel: "Delete",
    danger: true,
    onConfirm: () => {
      const idx = layouts.value.findIndex((l) => l.id === targetId);
      if (idx === -1) return;
      layouts.value.splice(idx, 1);
      activeLayoutId.value = layouts.value[0]?.id || null;
    },
  };
}
</script>

<template>
  <div class="layouts-tab">
    <div class="seating-toolbar">
      <div v-if="layouts.length > 1" class="layout-switcher">
        <button
          v-for="l in layouts"
          :key="l.id"
          class="layout-switch-btn"
          :class="{ active: l.id === activeLayout?.id }"
          type="button"
          @click="selectLayout(l.id)"
        >
          {{ l.name }}
        </button>
      </div>

      <template v-if="!readOnly">
        <button class="btn-icon" type="button" @click="addLayout"><i class="ti ti-plus"></i> Layout</button>
        <template v-if="activeLayout && !isLegacyLayout">
          <button class="btn-icon" type="button" @click="renameLayout"><i class="ti ti-edit"></i> Rename</button>
          <button class="btn-icon" type="button" @click="deleteLayout"><i class="ti ti-trash"></i> Delete</button>
          <button class="btn-icon" type="button" @click="addTable('round')"><i class="ti ti-circle"></i> Round table</button>
          <button class="btn-icon" type="button" @click="addTable('panel')"><i class="ti ti-rectangle"></i> Podcast table</button>
        </template>
      </template>
      <span v-else class="seating-readonly-badge">Read-only</span>

      <span
        v-if="!readOnly && saveState !== 'idle'"
        class="seating-save-indicator"
        :class="saveState"
      >{{ saveState === "saving" ? "Saving…" : "Saved" }}</span>
    </div>

    <div v-if="inlinePrompt" class="seating-inline-prompt">
      <span class="seating-inline-prompt-title">{{ inlinePrompt.title }}</span>
      <input
        v-if="inlinePrompt.type === 'text'"
        v-model="inlinePrompt.value"
        type="text"
        class="form-input"
        autofocus
        @keyup.enter="confirmInlinePrompt"
        @keyup.escape="cancelInlinePrompt"
      />
      <div class="seating-inline-prompt-actions">
        <button class="btn-secondary" type="button" @click="cancelInlinePrompt">Cancel</button>
        <button
          class="btn-icon"
          :class="{ 'seating-danger-btn': inlinePrompt.danger }"
          type="button"
          @click="confirmInlinePrompt"
        >{{ inlinePrompt.confirmLabel }}</button>
      </div>
    </div>

    <SeatingCanvas
      v-if="activeLayout && !isLegacyLayout"
      :elements="activeLayout.elements"
      :vips="event.vips || []"
      :read-only="readOnly"
    />

    <div v-else-if="activeLayout && isLegacyLayout" class="seating-canvas">
      <div class="stage-label">— Stage / Podium —</div>
      <div v-for="(row, ri) in activeLayout.rows" :key="ri" class="seating-row">
        <div v-for="(seat, si) in row" :key="si" class="seat" :class="seat.cat">{{ seat.label }}</div>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="ti ti-layout-rows"></i>
      <p v-if="readOnly">No layout yet.</p>
      <p v-else>No layout yet — add a round or podcast table above, or ask the AI Assistant to create one.</p>
    </div>
  </div>
</template>
