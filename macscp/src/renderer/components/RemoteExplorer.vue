<template>
  <section class="remote-explorer">
    <div class="remote-header">
      <strong>Remote</strong>
      <button @click="refresh">⟳</button>
    </div>

    <div v-if="!connected" class="empty">
      Not connected
    </div>

    <FileExplorerRemote
      v-else
      :entries="entries"
      :current-path="currentPath"
      :error="error"
      @open="open"
      @refresh="refresh"
      @go-parent="goParent"
      @go-path="goPath"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import type { FileEntry } from "../../shared/filesystem/FileEntry";
import FileExplorerRemote from "./remote/FileExplorerRemote.vue";

const connected = ref(false);
const entries = ref<FileEntry[]>([]);
const currentPath = ref(".");
const error = ref("");

async function load(remotePath = ".") {
  try {
    error.value = "";
    entries.value = await window.macscp.sftp.listDirectory(remotePath);
    currentPath.value = remotePath;
    connected.value = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to list remote directory";
  }
}

function open(entry: FileEntry) {
  if (entry.type === "directory") {
    load(entry.path);
  }
}

function refresh() {
  if (connected.value) {
    load(currentPath.value);
  }
}

function goParent() {
  if (currentPath.value === "." || currentPath.value === "/") return;

  const parts = currentPath.value.split("/").filter(Boolean);
  parts.pop();

  const parent = parts.length ? "/" + parts.join("/") : "/";
  load(parent);
}

function goPath(path: string) {
  if (path.trim()) {
    load(path.trim());
  }
}

function handleConnected() {
  load(".");
}

onMounted(() => {
  window.addEventListener("macscp:sftp-connected", handleConnected);
});

onUnmounted(() => {
  window.removeEventListener("macscp:sftp-connected", handleConnected);
});
</script>

<style scoped>
.remote-explorer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.remote-header {
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  border-bottom: 1px solid #444;
}

.empty {
  padding: 20px;
  color: #aaa;
}
</style>