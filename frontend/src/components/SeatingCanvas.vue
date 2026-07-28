<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import SeatingChairPopover from "./SeatingChairPopover.vue";

const props = defineProps({
  elements: { type: Array, required: true },
  vips: { type: Array, default: () => [] },
  readOnly: { type: Boolean, default: false },
});

// Sizing constants live in a fixed 100-unit-tall space (viewH is always
// 100); viewW is recomputed from the container's live aspect ratio so
// circles stay circular instead of stretching, while x/y are still stored
// as 0-100 independent percentages (see seatingTools.js schema) — the two
// are reconciled at render/drag time via viewW, not by distorting storage.
const VIEW_H = 100;
const ROUND_RADIUS = 8;
const CHAIR_RADIUS = 2.4;
const CHAIR_ORBIT_GAP = 3.5;
const PANEL_HEIGHT = 4;
const PANEL_MIN_WIDTH = 10;
const PANEL_SEAT_SPACING = 6;
const PANEL_SEAT_OFFSET = 6;
const FACING_TICK_LEN = 2.2;

const canvasWrap = ref(null);
const svgEl = ref(null);
const viewW = ref(160);

function updateViewBox() {
  const rect = canvasWrap.value?.getBoundingClientRect();
  if (!rect || !rect.height) return;
  viewW.value = Math.max(60, (rect.width / rect.height) * VIEW_H);
}

let resizeObserver = null;

onMounted(() => {
  updateViewBox();
  resizeObserver = new ResizeObserver(updateViewBox);
  resizeObserver.observe(canvasWrap.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function panelWidth(el) {
  return Math.max(PANEL_MIN_WIDTH, el.seats.length * PANEL_SEAT_SPACING);
}

function tableExtent(el) {
  return el.type === "round"
    ? ROUND_RADIUS + CHAIR_ORBIT_GAP + CHAIR_RADIUS
    : PANEL_HEIGHT / 2 + PANEL_SEAT_OFFSET + CHAIR_RADIUS;
}

function chairPositions(el) {
  const n = el.seats.length;
  if (n === 0) return [];

  if (el.type === "round") {
    const radius = ROUND_RADIUS + CHAIR_ORBIT_GAP;
    return Array.from({ length: n }, (_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
    });
  }

  const width = panelWidth(el);
  const y = -(PANEL_HEIGHT / 2 + PANEL_SEAT_OFFSET);
  const startX = -width / 2 + PANEL_SEAT_SPACING / 2;
  return Array.from({ length: n }, (_, i) => ({ x: startX + i * PANEL_SEAT_SPACING, y }));
}

function groupTransform(el) {
  const cx = (el.x / 100) * viewW.value;
  const cy = (el.y / 100) * VIEW_H;
  const rot = el.type === "panel" ? el.rotation || 0 : 0;
  return `translate(${cx},${cy}) rotate(${rot})`;
}

function controlsTransform(el, offsetX) {
  return `translate(${offsetX}, ${-(tableExtent(el) + 6)})`;
}

function resolveSeat(seat) {
  if (seat.vipId) {
    const vip = props.vips.find((v) => v.id === seat.vipId);
    if (vip) return { name: vip.name, cat: vip.category || "guest" };
  }
  if (seat.name) return { name: seat.name, cat: seat.cat || "guest" };
  return { name: "", cat: "empty" };
}

function initials(name) {
  return (name || "").split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}

// --- drag ---
function toSvgPoint(evt) {
  const svg = svgEl.value;
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  return pt.matrixTransform(ctm.inverse());
}

const draggingId = ref(null);
let dragOffset = { x: 0, y: 0 };

function startDrag(evt, el) {
  if (props.readOnly) return;
  evt.currentTarget.setPointerCapture(evt.pointerId);
  draggingId.value = el.id;
  const p = toSvgPoint(evt);
  dragOffset = {
    x: p.x - (el.x / 100) * viewW.value,
    y: p.y - (el.y / 100) * VIEW_H,
  };
}

function onDrag(evt, el) {
  if (draggingId.value !== el.id) return;
  const p = toSvgPoint(evt);
  el.x = clamp(((p.x - dragOffset.x) / viewW.value) * 100, 4, 96);
  el.y = clamp(((p.y - dragOffset.y) / VIEW_H) * 100, 4, 96);
}

function endDrag(evt) {
  evt.currentTarget.releasePointerCapture?.(evt.pointerId);
  draggingId.value = null;
}

// --- table/seat editing ---
function removeTable(el) {
  if (props.readOnly) return;
  const idx = props.elements.indexOf(el);
  if (idx !== -1) props.elements.splice(idx, 1);
}

function addSeat(el) {
  if (props.readOnly) return;
  el.seats.push({ id: crypto.randomUUID(), vipId: null, name: null, cat: null });
}

function removeSeat(el) {
  if (props.readOnly || el.seats.length <= 1) return;
  el.seats.splice(el.seats.length - 1, 1);
}

function rotateTable(el, delta) {
  if (props.readOnly) return;
  el.rotation = ((el.rotation || 0) + delta + 360) % 360;
}

// --- chair assignment popover ---
const popover = ref(null);

function openPopover(evt, seat) {
  if (props.readOnly) return;
  const rect = canvasWrap.value.getBoundingClientRect();
  const left = clamp(evt.clientX - rect.left, 0, Math.max(0, rect.width - 232));
  const top = clamp(evt.clientY - rect.top, 0, Math.max(0, rect.height - 220));
  popover.value = { seat, style: { left: `${left}px`, top: `${top}px` } };
}

function closePopover() {
  popover.value = null;
}

function onAssignVip(vipId) {
  if (!popover.value) return;
  popover.value.seat.vipId = vipId;
  popover.value.seat.name = null;
  popover.value.seat.cat = null;
  closePopover();
}

function onAssignFreeform({ name, cat }) {
  if (!popover.value) return;
  popover.value.seat.vipId = null;
  popover.value.seat.name = name;
  popover.value.seat.cat = cat;
  closePopover();
}

function onClearSeat() {
  if (!popover.value) return;
  popover.value.seat.vipId = null;
  popover.value.seat.name = null;
  popover.value.seat.cat = null;
  closePopover();
}
</script>

<template>
  <div ref="canvasWrap" class="seating-canvas-editor">
    <svg ref="svgEl" class="seating-svg" :viewBox="`0 0 ${viewW} ${VIEW_H}`" preserveAspectRatio="xMidYMid meet">
      <g
        v-for="el in elements"
        :key="el.id"
        class="seat-table-group"
        :class="{ dragging: draggingId === el.id }"
        :transform="groupTransform(el)"
        @pointerdown="startDrag($event, el)"
        @pointermove="onDrag($event, el)"
        @pointerup="endDrag($event)"
        @pointercancel="endDrag($event)"
      >
        <circle v-if="el.type === 'round'" class="seat-table-shape" r="8" cx="0" cy="0" />
        <rect
          v-else
          class="seat-table-shape"
          :x="-panelWidth(el) / 2"
          :y="-PANEL_HEIGHT / 2"
          :width="panelWidth(el)"
          :height="PANEL_HEIGHT"
          rx="1.5"
        />

        <text class="seat-table-label-text" y="0.9">{{ el.label || "Table" }}</text>

        <template v-if="el.type === 'panel'">
          <line
            v-for="(pos, i) in chairPositions(el)"
            :key="'tick-' + el.seats[i].id"
            class="seat-facing-tick"
            :x1="pos.x"
            :y1="pos.y"
            :x2="pos.x"
            :y2="pos.y - FACING_TICK_LEN"
          />
        </template>

        <g
          v-for="(pos, i) in chairPositions(el)"
          :key="el.seats[i].id"
          class="seat-chair"
          :transform="`translate(${pos.x},${pos.y})`"
          @pointerdown.stop="openPopover($event, el.seats[i])"
        >
          <circle class="seat-chair-shape" :class="resolveSeat(el.seats[i]).cat" :r="CHAIR_RADIUS" />
          <text class="seat-chair-label" y="0.9">{{ initials(resolveSeat(el.seats[i]).name) }}</text>
        </g>

        <g v-if="!readOnly" class="seat-table-controls">
          <g :transform="controlsTransform(el, -9)" @pointerdown.stop="removeTable(el)">
            <circle class="seat-chair-shape empty" r="2.2" />
            <text class="seat-chair-label" y="0.7">×</text>
          </g>
          <g :transform="controlsTransform(el, -3)" @pointerdown.stop="removeSeat(el)">
            <circle class="seat-chair-shape empty" r="2.2" />
            <text class="seat-chair-label" y="0.7">−</text>
          </g>
          <g :transform="controlsTransform(el, 3)" @pointerdown.stop="addSeat(el)">
            <circle class="seat-chair-shape empty" r="2.2" />
            <text class="seat-chair-label" y="0.7">+</text>
          </g>
          <template v-if="el.type === 'panel'">
            <g :transform="controlsTransform(el, 9)" @pointerdown.stop="rotateTable(el, -45)">
              <circle class="seat-chair-shape empty" r="2.2" />
              <text class="seat-chair-label" y="0.7">⟲</text>
            </g>
            <g :transform="controlsTransform(el, 15)" @pointerdown.stop="rotateTable(el, 45)">
              <circle class="seat-chair-shape empty" r="2.2" />
              <text class="seat-chair-label" y="0.7">⟳</text>
            </g>
          </template>
        </g>
      </g>
    </svg>

    <SeatingChairPopover
      v-if="popover"
      :vips="vips"
      :style="popover.style"
      @assign-vip="onAssignVip"
      @assign-freeform="onAssignFreeform"
      @clear="onClearSeat"
      @close="closePopover"
    />
  </div>
</template>
