<template>
  <div class="connection-panel">
    <input v-model="connectionStore.host" placeholder="Host" />
    <input v-model.number="connectionStore.port" placeholder="Port" />
    <input v-model="connectionStore.username" placeholder="Username" />
    <input v-model="connectionStore.password" placeholder="Password" type="password" />

    <button @click="connect" :disabled="loading">
      {{ loading ? "Connecting..." : "Connect" }}
    </button>
    <button @click="syncCompared">Sync</button>
    <button @click="startWatchSync">Start Watch Sync</button>
    <button @click="stopWatchSync">Stop Watch Sync</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { onMounted, onUnmounted } from "vue";
import type { SavedSession } from "../../shared/sessions/Session";
import { useSessionStore } from "../stores/sessionStore";
import { useConnectionStore } from "../stores/connectionStore";
import { useCompareStore } from "../stores/compareStore";
import { joinRemotePath } from "../../shared/utils/remotePath";
import { useExplorerStore } from "../stores/explorerStore";
const connectionStore = useConnectionStore();

const sessionStore = useSessionStore();

const compareStore = useCompareStore();
const explorerStore = useExplorerStore();
const loading = ref(false);
const status = ref("");

watch(
  () => sessionStore.pendingLoadSession,
  async session => {
    if (!session) return;

    try {
      sessionStore.setActiveSession(session.id);

      connectionStore.host = session.host;
      connectionStore.port = session.port;
      connectionStore.username = session.username;

      const savedPassword = await window.macscp.sessions.getDecryptedPassword(session.id);
      connectionStore.password = savedPassword || "";

      status.value = savedPassword
        ? "Session loaded with saved password"
        : "Session loaded. Enter password.";

      sessionStore.clearPendingLoadSession();
      explorerStore.setLocalPath(session.localPath);
      explorerStore.setRemotePath(session.remotePath);
    } catch (err) {
      status.value = err instanceof Error ? err.message : "Failed to load session";
    }
  }
);

async function connect() {
  loading.value = true;
  status.value = "";

  try {
    await window.macscp.sftp.connect({
      host: connectionStore.host,
      port: connectionStore.port,
      username: connectionStore.username,
      password: connectionStore.password,
    });

    status.value = "Connected";
    window.dispatchEvent(new CustomEvent("macscp:sftp-connected"));
    connectionStore.setConnected(true);

    status.value = "Connected successfully";
  } catch (err) {
    status.value = err instanceof Error ? err.message : "Connection failed";
    connectionStore.setConnected(false);
  } finally {
    loading.value = false;

  }
}

async function syncCompared() {
  if (!compareStore.entries.length) {
    await compareStore.compare(
      explorerStore.localPath,
      explorerStore.remotePath
    );
  }

  for (const entry of compareStore.entries) {
    if (
      (entry.status === "local-only" || entry.status === "local-newer") &&
      entry.local &&
      entry.local.type === "file"
    ) {
      await window.macscp.transfers.enqueue({
        id: crypto.randomUUID(),
        direction: "upload",
        sourcePath: entry.local.path,
        targetPath: joinRemotePath(explorerStore.remotePath, entry.local.name),
        filename: entry.local.name,
        status: "queued",
        progress: 0,
        bytesTransferred: 0,
        totalBytes: entry.local.size,
        createdAt: Date.now(),
      });
    }

    if (
      (entry.status === "remote-only" || entry.status === "remote-newer") &&
      entry.remote &&
      entry.remote.type === "file"
    ) {
      await window.macscp.transfers.enqueue({
        id: crypto.randomUUID(),
        direction: "download",
        sourcePath: entry.remote.path,
        targetPath: `${explorerStore.localPath.replace(/\/$/, "")}/${entry.remote.name}`,
        filename: entry.remote.name,
        status: "queued",
        progress: 0,
        bytesTransferred: 0,
        totalBytes: entry.remote.size,
        createdAt: Date.now(),
      });
    }
  }
}

async function startWatchSync() {
  try {
    if (!explorerStore.localPath || explorerStore.localPath === "Home") {
      status.value = "Choose a real local folder before starting watch sync";
      return;
    }

    if (!explorerStore.remotePath) {
      status.value = "Choose a remote folder before starting watch sync";
      return;
    }

    await window.macscp.watch.start({
      localPath: explorerStore.localPath,
      remotePath: explorerStore.remotePath,
    });

    status.value = "Watch sync started";
  } catch (err) {
    status.value = err instanceof Error ? err.message : "Failed to start watch sync";
  }
}

async function stopWatchSync() {
  await window.macscp.watch.stop();
  status.value = "Watch sync stopped";
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
