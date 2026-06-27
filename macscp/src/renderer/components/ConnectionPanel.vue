<template>
  <div class="connection-panel">
    <input v-model="host" placeholder="Host" />
    <input v-model.number="port" placeholder="Port" />
    <input v-model="username" placeholder="Username" />
    <input v-model="password" placeholder="Password" type="password" />

    <button @click="test" :disabled="loading">
      {{ loading ? "Testing..." : "Test Connection" }}
    </button>

    <span>{{ status }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const host = ref("");
const port = ref(22);
const username = ref("");
const password = ref("");
const loading = ref(false);
const status = ref("");

async function test() {
  loading.value = true;
  status.value = "";

  try {
    await window.macscp.sftp.connect({
      host: host.value,
      port: port.value,
      username: username.value,
      password: password.value,
    });

    status.value = "Connected";
    window.dispatchEvent(new CustomEvent("macscp:sftp-connected"));

    status.value = "Connected successfully";
  } catch (err) {
    status.value = err instanceof Error ? err.message : "Connection failed";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.connection-panel {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #252525;
  border-bottom: 1px solid #444;
}

input {
  background: #1f1f1f;
  color: white;
  border: 1px solid #555;
  padding: 5px 8px;
}

button {
  background: #333;
  color: white;
  border: 1px solid #666;
  padding: 5px 10px;
}
</style>
