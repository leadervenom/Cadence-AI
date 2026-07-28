<script setup>
import { ref } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "invite"]);

const email = ref("");

function resetForm() {
  email.value = "";
}

function handleClose() {
  resetForm();
  emit("close");
}

function handleInvite() {
  if (!email.value.trim()) {
    emit("invite-error", "Email is required");
    return;
  }
  emit("invite", email.value.trim());
  resetForm();
}
</script>

<template>
  <div class="modal-overlay" :class="{ open }">
    <div class="modal">
      <div class="modal-header">
        <h2>Invite Event Organizer</h2>
        <button class="modal-close" type="button" @click="handleClose"><i class="ti ti-x"></i></button>
      </div>
      <div class="form-field">
        <label class="form-label">Email</label>
        <input class="form-input" type="email" v-model="email" placeholder="organizer@example.com">
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="handleClose">Cancel</button>
        <button class="btn-primary btn-create" type="button" @click="handleInvite">Send Invite</button>
      </div>
    </div>
  </div>
</template>
