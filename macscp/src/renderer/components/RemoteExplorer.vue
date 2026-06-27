<template>
  <Explorer
    title="Remote"
    :status="connected ? currentPath : 'Not connected'"
    :entries="entries"
    :current-path="currentPath"
    :error="error"
    :empty-message="connected ? '' : 'Not connected'"
    :can-go-parent="connected && currentPath !== '.' && currentPath !== '/'"
    @open="open"
    @refresh="refresh"
    @go-parent="goParent"
    @go-path="goPath"
    @selection-change="handleSelection"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import type { FileEntry } from "../../shared/filesystem/FileEntry";
import Explorer from "./Explorer.vue";

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

function handleSelection(entries: FileEntry[]) {
  console.log("Remote selected:", entries);
}

onMounted(() => {
  window.addEventListener("macscp:sftp-connected", handleConnected);
});

onUnmounted(() => {
  window.removeEventListener("macscp:sftp-connected", handleConnected);
});
</script>