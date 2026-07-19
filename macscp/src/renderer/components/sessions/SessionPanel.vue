<template>
  <aside class="sessions">
    <header>
      <strong>Sessions</strong>
      <button @click="saveCurrent">Save Current</button>
    </header>

    <div v-for="session in store.sessions" :key="session.id" class="session">
      <button class="session-main" @click="$emit('load-session', session)">
        <strong v-if="editingSessionId !== session.id">{{ session.name }}</strong>
        <input
          v-else
          v-model="editingName"
          class="rename-input"
          aria-label="Session name"
          @click.stop
          @keydown.enter.prevent.stop="saveRename(session)"
          @keydown.escape.prevent.stop="cancelRename"
        />
        <span>{{ session.username }}@{{ session.host }}:{{ session.port }}</span>
      </button>
      <div class="session-actions">
        <template v-if="editingSessionId === session.id">
          <button title="Save session name" @click="saveRename(session)">Save</button>
          <button title="Cancel rename" @click="cancelRename">Cancel</button>
        </template>
        <button v-else title="Rename session" @click="beginRename(session)">Rename</button>
        <button class="delete" title="Delete session" @click="deleteSession(session)">Delete</button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import type { SavedSession } from "../../../shared/sessions/Session";
import { useSessionStore } from "../../stores/sessionStore";
import { useTabStore } from "../../stores/tabStore";
const store = useSessionStore();
const tabStore = useTabStore();
const editingSessionId = ref<string | null>(null);
const editingName = ref("");

defineEmits<{
  "load-session": [session: SavedSession];
}>();

onMounted(() => {
  store.load();
});

async function saveCurrent() {
  const tab = tabStore.activeTab;
  if (!tab?.connection.host || !tab.connection.username) {
    console.warn("Cannot save session: host or username is missing.");
    return;

  }

  const now = Date.now();
  const id = tab.sessionId || crypto.randomUUID();
const session = {
  id,
  name: `${tab.connection.username}@${tab.connection.host}`,
  host: tab.connection.host,
  port: tab.connection.port,
  username: tab.connection.username,
  remotePath: tab.remotePath,
  localPath: tab.localPath,
  ignorePatterns: [...tab.ignorePatterns],
  hasPassword: Boolean(tab.connection.password),
  createdAt: now,
  updatedAt: now,
};

await store.save(session, tab.connection.password);
tab.sessionId = session.id;
tab.title = session.name;
}

async function beginRename(session: SavedSession) {
  editingSessionId.value = session.id;
  editingName.value = session.name;
  await nextTick();
  document.querySelector<HTMLInputElement>(".rename-input")?.select();
}

function cancelRename() {
  editingSessionId.value = null;
  editingName.value = "";
}

async function saveRename(session: SavedSession) {
  const name = editingName.value.trim();
  if (!name) return;
  if (name === session.name) {
    cancelRename();
    return;
  }

  await store.save({ ...session, name, updatedAt: Date.now() });
  for (const tab of tabStore.tabs) {
    if (tab.sessionId === session.id) tab.title = name;
  }
  cancelRename();
}

async function deleteSession(session: SavedSession) {
  if (!window.confirm(`Delete the saved session “${session.name}”? Open tabs will remain connected.`)) return;

  await store.delete(session.id);
  for (const tab of tabStore.tabs) {
    if (tab.sessionId === session.id) tab.sessionId = null;
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
  align-items: stretch;
  border-bottom: 1px solid #333;
  background: transparent;
}

.session:hover {
  background: #303030;
}

.session-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  border: 0;
  background: transparent;
  padding: 10px;
  text-align: left;
}

.session-main span {
  color: #aaa;
  font-size: 12px;
}

.rename-input {
  width: 100%;
  min-width: 0;
  padding: 3px 5px;
  color: white;
  background: #181818;
  border: 1px solid #5794c7;
}

.session-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 5px;
}

.session-actions button {
  padding: 3px 6px;
  font-size: 11px;
}

.session-actions .delete {
  color: #ff9b9b;
  border-color: #874848;
}
</style>
