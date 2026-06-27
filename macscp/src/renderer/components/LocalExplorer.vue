<template>
  <section class="explorer">
    <div class="explorer-header">
      <strong>Local</strong>
      <span>{{ currentPath }}</span>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <table>
      <tbody>
        <tr v-for="entry in entries" :key="entry.path" @dblclick="open(entry)">
          <td>{{ icon(entry.type) }}</td>
          <td>{{ entry.name }}</td>
          <td>{{ entry.type === "directory" ? "" : formatSize(entry.size) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { FileEntry } from "../../shared/filesystem/FileEntry";

const entries = ref<FileEntry[]>([]);
const currentPath = ref("");
const error = ref("");

async function load(dirPath?: string) {
  try {
    error.value = "";
    entries.value = await window.macscp.local.listDirectory(dirPath);
    currentPath.value = dirPath || "Home";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load directory";
  }
}

function open(entry: FileEntry) {
  if (entry.type === "directory") {
    load(entry.path);
  }
}

function icon(type: FileEntry["type"]) {
  return type === "directory" ? "📁" : "📄";
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

onMounted(() => load());
</script>

<style scoped>
.explorer {
  height: 100%;
  overflow: auto;
}

.explorer-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #444;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td {
  padding: 6px 8px;
  border-bottom: 1px solid #333;
}

tr {
  cursor: default;
}

tr:hover {
  background: #333;
}

.error {
  color: #ff7777;
  padding: 10px 0;
}
</style>