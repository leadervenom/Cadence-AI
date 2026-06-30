<script setup>
import { reactive } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "create"]);

const form = reactive({
  name: "",
  type: "",
  date: "",
  status: "draft",
  venue: "",
  notes: "",
});

function resetForm() {
  form.name = "";
  form.type = "";
  form.date = "";
  form.status = "draft";
  form.venue = "";
  form.notes = "";
}

function handleClose() {
  emit("close");
}

function handleCreate() {
  if (!form.name.trim()) {
    emit("create-error", "Event name is required");
    return;
  }
  emit("create", { ...form });
  resetForm();
}
</script>

<template>
  <div class="modal-overlay" :class="{ open }">
    <div class="modal">
      <div class="modal-header">
        <h2>Create New Event</h2>
        <button class="modal-close" type="button" @click="handleClose"><i class="ti ti-x"></i></button>
      </div>
      <div class="form-field">
        <label class="form-label">Event Name</label>
        <input class="form-input" v-model="form.name" placeholder="e.g. Majlis Santapan Diraja Johor">
      </div>
      <div class="form-field">
        <label class="form-label">Event Type</label>
        <input class="form-input" v-model="form.type" placeholder="e.g. Annual Royal Banquet — State Protocol Grade I">
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Date</label>
          <input class="form-input" type="date" v-model="form.date">
        </div>
        <div class="form-field">
          <label class="form-label">Status</label>
          <select class="form-select" v-model="form.status">
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Venue</label>
        <input class="form-input" v-model="form.venue" placeholder="e.g. Istana Besar">
      </div>
      <div class="form-field">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" v-model="form.notes" placeholder="Additional details…"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="handleClose">Cancel</button>
        <button class="btn-primary btn-create" type="button" @click="handleCreate">Create Event</button>
      </div>
    </div>
  </div>
</template>
