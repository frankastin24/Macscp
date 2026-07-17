<template>
  <aside class="sessions">
    <header>
      <strong>Sessions</strong>
      <button @click="saveCurrent">Save Current</button>
    </header>

    <button v-for="session in store.sessions" :key="session.id" class="session" @click="$emit('load-session', session)">
      <strong>{{ session.name }}</strong>
      <span>{{ session.username }}@{{ session.host }}:{{ session.port }}</span>
    </button>
  </aside>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import type { SavedSession } from "../../../shared/sessions/Session";
import { useSessionStore } from "../../stores/sessionStore";
import { useConnectionStore } from "../../stores/connectionStore";
import { useExplorerStore } from "../../stores/explorerStore";
const store = useSessionStore();
const connectionStore = useConnectionStore();
const explorerStore = useExplorerStore();

defineEmits<{
  "load-session": [session: SavedSession];
}>();

onMounted(() => {
  store.load();
});

async function saveCurrent() {
  if (!connectionStore.host || !connectionStore.username) {
    console.warn("Cannot save session: host or username is missing.");
    return;

  }

  const now = Date.now();
  const id = crypto.randomUUID();
const session = {
  id,
  name: `${connectionStore.username}@${connectionStore.host}`,
  host: connectionStore.host,
  port: connectionStore.port,
  username: connectionStore.username,
  remotePath: explorerStore.remotePath,
  localPath: explorerStore.localPath,
  hasPassword: Boolean(connectionStore.password),
  createdAt: now,
  updatedAt: now,
};

await store.save(session, connectionStore.password);
store.setActiveSession(session.id);

  if (connectionStore.password) {
    await window.macscp.sessions.savePassword(id, connectionStore.password);
  }
}
</script>

<style scoped>
.sessions {
  width: 230px;
  background: #1d1d1d;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

header {
  height: 38px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #444;
}

button {
  background: #333;
  color: white;
  border: 1px solid #555;
  padding: 4px 8px;
}

.session {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  border: none;
  border-bottom: 1px solid #333;
  background: transparent;
  padding: 10px;
  text-align: left;
}

.session:hover {
  background: #303030;
}

.session span {
  color: #aaa;
  font-size: 12px;
}
</style>