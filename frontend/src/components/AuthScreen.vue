<script setup>
import { ref } from "vue";
import api from "../services/api.js";
import { login as storeLogin } from "../services/authStore.js";

const emit = defineEmits(["login", "login-error"]);

const mode = ref("login"); // "login" | "register"
const busy = ref(false);
const showPassword = ref(false);

const email = ref("");
const password = ref("");
const fullName = ref("");
const role = ref("event_organizer");

const roles = [
  { value: "event_organizer", label: "Event Organizer" },
  { value: "protocol_officer", label: "Protocol Officer" },
  { value: "usher", label: "Usher" },
  { value: "viewer", label: "Viewer" },
];

function togglePassword() {
  showPassword.value = !showPassword.value;
}

function switchMode(next) {
  mode.value = next;
}

async function handleSubmit() {
  if (busy.value) return;

  if (!email.value.trim() || !password.value) {
    emit("login-error", "Enter your email and password");
    return;
  }

  if (mode.value === "register" && !fullName.value.trim()) {
    emit("login-error", "Enter your full name");
    return;
  }

  busy.value = true;

  try {
    const result = mode.value === "register"
      ? await api.auth.register({
          fullName: fullName.value.trim(),
          email: email.value.trim(),
          password: password.value,
          role: role.value,
        })
      : await api.auth.login(email.value.trim(), password.value);

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
    <div class="auth-sub">{{ mode === "login" ? "Sign in to your command terminal" : "Create your operator account" }}</div>
    <div class="auth-card">
      <div class="field" v-if="mode === 'register'">
        <label>Full Name</label>
        <input type="text" v-model="fullName" placeholder="Your full name" @keydown.enter="handleSubmit">
      </div>
      <div class="field">
        <label>Email</label>
        <input type="email" v-model="email" placeholder="you@example.com" @keydown.enter="handleSubmit">
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
      <div class="field" v-if="mode === 'register'">
        <label>Operational Role</label>
        <select v-model="role">
          <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </div>
      <button class="btn-primary" type="button" :disabled="busy" @click="handleSubmit">
        {{ busy ? "Please wait…" : (mode === "login" ? "Sign In" : "Create Account") }}
      </button>
      <button class="link-btn" type="button" @click="switchMode(mode === 'login' ? 'register' : 'login')">
        {{ mode === "login" ? "Need an account? Register" : "Already have an account? Sign in" }}
      </button>
    </div>
    <div class="auth-footer">RESTRICTED ACCESS — AUTHORISED PERSONNEL ONLY</div>
  </div>
</template>
