<script setup>
import { ref } from "vue";

const emit = defineEmits(["login"]);

const username = ref("sai");
const password = ref("password");
const role = ref("Operations Commander");
const showPassword = ref(false);

const roles = [
  "Operations Commander",
  "Protocol Officer",
  "Event Organizer",
  "Stage Manager",
  "Usher",
];

function togglePassword() {
  showPassword.value = !showPassword.value;
}

function handleLogin() {
  const trimmed = username.value.trim();
  if (!trimmed) {
    emit("login-error", "Enter your Operator ID");
    return;
  }
  emit("login", { username: trimmed, role: role.value });
}
</script>

<template>
  <div id="auth-screen">
    <div class="auth-logo"><i class="ti ti-shield-check"></i></div>
    <div class="auth-title">Cadence Operations</div>
    <div class="auth-sub">Sign in to your command terminal</div>
    <div class="auth-card">
      <div class="field">
        <label>Operator ID</label>
        <input type="text" v-model="username" placeholder="Enter your username" @keydown.enter="handleLogin">
      </div>
      <div class="field">
        <label>Access Code</label>
        <div class="input-wrap">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="••••••••"
            @keydown.enter="handleLogin"
          >
          <button class="eye-btn" type="button" @click="togglePassword">
            <i :class="['ti', showPassword ? 'ti-eye-off' : 'ti-eye']"></i>
          </button>
        </div>
      </div>
      <div class="field">
        <label>Operational Role</label>
        <select v-model="role">
          <option v-for="r in roles" :key="r">{{ r }}</option>
        </select>
      </div>
      <button class="btn-primary" type="button" @click="handleLogin">Sign In</button>
    </div>
    <div class="auth-footer">RESTRICTED ACCESS — AUTHORISED PERSONNEL ONLY</div>
  </div>
</template>
