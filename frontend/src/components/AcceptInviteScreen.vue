<script setup>
import { ref } from "vue";
import api from "../services/api.js";
import { login as storeLogin } from "../services/authStore.js";

const props = defineProps({
  token: { type: String, required: true },
});
const emit = defineEmits(["login", "login-error"]);

const busy = ref(false);
const showPassword = ref(false);
const fullName = ref("");
const password = ref("");

function togglePassword() {
  showPassword.value = !showPassword.value;
}

async function handleSubmit() {
  if (busy.value) return;

  if (!fullName.value.trim() || !password.value) {
    emit("login-error", "Enter your full name and a password");
    return;
  }

  busy.value = true;

  try {
    const result = await api.auth.acceptInvite({
      token: props.token,
      fullName: fullName.value.trim(),
      password: password.value,
    });

    storeLogin(result.token, result.user);
    emit("login", result.user);
  } catch (err) {
    emit("login-error", err.message || "Something went wrong");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div id="auth-screen">
    <div class="auth-logo"><i class="ti ti-shield-check"></i></div>
    <div class="auth-title">Cadence Operations</div>
    <div class="auth-sub">Set up your Event Organizer account</div>
    <div class="auth-card">
      <div class="field">
        <label>Full Name</label>
        <input type="text" v-model="fullName" placeholder="Your full name" @keydown.enter="handleSubmit">
      </div>
      <div class="field">
        <label>Password</label>
        <div class="input-wrap">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="••••••••"
            @keydown.enter="handleSubmit"
          >
          <button class="eye-btn" type="button" @click="togglePassword">
            <i :class="['ti', showPassword ? 'ti-eye-off' : 'ti-eye']"></i>
          </button>
        </div>
      </div>
      <button class="btn-primary" type="button" :disabled="busy" @click="handleSubmit">
        {{ busy ? "Please wait…" : "Set Up Account" }}
      </button>
    </div>
    <div class="auth-footer">RESTRICTED ACCESS — AUTHORISED PERSONNEL ONLY</div>
  </div>
</template>
