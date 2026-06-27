<template>
  <section class="explorer">
    <div class="explorer-toolbar">
      <button @click="goParent" :disabled="!canGoParent">⬆</button>
      <button @click="refresh">⟳</button>
      <input v-model="pathInput" @keyup.enter="goToPath" />
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <table>
      <thead>
        <tr>
          <th @click="setSort('name')">Name</th>
          <th @click="setSort('size')">Size</th>
          <th @click="setSort('modifiedAt')">Modified</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="entry in sortedEntries" :key="entry.path" @dblclick="open(entry)">
          <td>{{ icon(entry.type) }} {{ entry.name }}</td>
          <td>{{ entry.type === "directory" ? "" : formatSize(entry.size) }}</td>
          <td>{{ formatDate(entry.modifiedAt) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { FileEntry } from "../../shared/filesystem/FileEntry";

type SortKey = "name" | "size" | "modifiedAt";

const entries = ref<FileEntry[]>([]);
const currentPath = ref("");
const pathInput = ref("");
const error = ref("");
const sortKey = ref<SortKey>("name");
const sortDirection = ref<"asc" | "desc">("asc");

const canGoParent = computed(() => currentPath.value.includes("/"));

const sortedEntries = computed(() => {
  return [...entries.value].sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;

    const direction = sortDirection.value === "asc" ? 1 : -1;

    if (sortKey.value === "name") {
      return a.name.localeCompare(b.name) * direction;
    }

    return (a[sortKey.value] - b[sortKey.value]) * direction;
  });
});

async function load(dirPath?: string) {
  try {
    error.value = "";
    entries.value = await window.macscp.local.listDirectory(dirPath);
    currentPath.value = dirPath || currentPath.value || "Home";
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
  if (!currentPath.value || currentPath.value === "Home") return;

  const parts = currentPath.value.split("/").filter(Boolean);
  parts.pop();

  const parent = "/" + parts.join("/");
  load(parent === "/" ? "/" : parent);
}

function goToPath() {
  if (pathInput.value.trim()) {
    load(pathInput.value.trim());
  }
}

function setSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDirection.value = "asc";
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

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

onMounted(() => load());
</script>

<style scoped>
.explorer {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.explorer-toolbar {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid #444;
}

button {
  background: #333;
  color: white;
  border: 1px solid #555;
  padding: 4px 8px;
}

button:disabled {
  opacity: 0.4;
}

input {
  flex: 1;
  background: #1f1f1f;
  color: white;
  border: 1px solid #555;
  padding: 5px 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

thead {
  background: #2b2b2b;
}

th,
td {
  padding: 7px 8px;
  border-bottom: 1px solid #333;
  text-align: left;
}

th {
  cursor: pointer;
  user-select: none;
}

tbody {
  overflow: auto;
}

tr:hover {
  background: #333;
}

.error {
  color: #ff7777;
  padding: 8px;
}
</style>