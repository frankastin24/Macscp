<template>
  <Explorer
    title="Local"
    :status="currentPath"
    :entries="entries"
    :current-path="pathInput"
    :error="error"
    :can-go-parent="currentPath !== 'Home'"
    @open="open"
    @refresh="refresh"
    @go-parent="goParent"
    @go-path="goToPath"
    @selection-change="handleSelection"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { FileEntry } from "../../shared/filesystem/FileEntry";
import Explorer from "./Explorer.vue";

const entries = ref<FileEntry[]>([]);
const currentPath = ref("Home");
const pathInput = ref("Home");
const error = ref("");

async function load(dirPath?: string) {
  try {
    error.value = "";
    entries.value = await window.macscp.local.listDirectory(dirPath);
    currentPath.value = dirPath || "Home";
    pathInput.value = currentPath.value;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load directory";
  }
}

function open(entry: FileEntry) {
  if (entry.type === "directory") {
    load(entry.path);
  }
}

function refresh() {
  load(currentPath.value === "Home" ? undefined : currentPath.value);
}

function goParent() {
  if (currentPath.value === "Home") return;

  const parts = currentPath.value.split("/").filter(Boolean);
  parts.pop();

  const parent = parts.length ? "/" + parts.join("/") : "/";
  load(parent);
}

function goToPath(path: string) {
  if (!path.trim() || path === "Home") {
    load();
    return;
  }

  load(path.trim());
}

function handleSelection(entries: FileEntry[]) {
  console.log("Local selected:", entries);
}

onMounted(() => load());
</script>