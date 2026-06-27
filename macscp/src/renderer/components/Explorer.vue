<template>
  <section class="explorer">
    <div class="explorer-header">
      <strong>{{ title }}</strong>
      <span>{{ status }}</span>
    </div>

    <div class="explorer-toolbar">
      <button @click="$emit('go-parent')" :disabled="!canGoParent">⬆</button>
      <button @click="$emit('refresh')">⟳</button>
      <input v-model="pathInput" @keyup.enter="$emit('go-path', pathInput)" />
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="emptyMessage" class="empty">{{ emptyMessage }}</div>

    <table v-else>
      <thead>
        <tr>
          <th @click="setSort('name')">Name {{ sortLabel('name') }}</th>
          <th @click="setSort('size')">Size {{ sortLabel('size') }}</th>
          <th @click="setSort('modifiedAt')">Modified {{ sortLabel('modifiedAt') }}</th>
        </tr>
      </thead>

      <tbody>
  <tr
    v-for="(entry, index) in sortedEntries"
    :key="entry.path"
    :class="{ selected: selectedPaths.includes(entry.path) }"
    @click="selectEntry(entry, index, $event)"
    @dblclick="$emit('open', entry)"
  >
    <td>{{ icon(entry.type) }} {{ entry.name }}</td>
    <td>{{ entry.type === "directory" ? "" : formatSize(entry.size) }}</td>
    <td>{{ formatDate(entry.modifiedAt) }}</td>
  </tr>
</tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { FileEntry } from "../../../shared/filesystem/FileEntry";

type SortKey = "name" | "size" | "modifiedAt";

const props = defineProps<{
  title: string;
  status?: string;
  entries: FileEntry[];
  currentPath: string;
  error?: string;
  emptyMessage?: string;
  canGoParent?: boolean;
}>();

const emit = defineEmits<{
  open: [entry: FileEntry];
  refresh: [];
  goParent: [];
  goPath: [path: string];
  selectionChange: [entries: FileEntry[]];
}>();

const pathInput = ref(props.currentPath);
const sortKey = ref<SortKey>("name");
const sortDirection = ref<"asc" | "desc">("asc");
watch(
  () => props.currentPath,
  () => {
    selectedPaths.value = [];
    lastSelectedIndex.value = null;
    emit("selectionChange", []);
  }
);
watch(
  () => props.currentPath,
  value => {
    pathInput.value = value;
  }
);

const sortedEntries = computed(() => {
  return [...props.entries].sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;

    const direction = sortDirection.value === "asc" ? 1 : -1;

    if (sortKey.value === "name") {
      return a.name.localeCompare(b.name) * direction;
    }

    return (a[sortKey.value] - b[sortKey.value]) * direction;
  });
});

function setSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDirection.value = "asc";
  }
}

function sortLabel(key: SortKey) {
  if (sortKey.value !== key) return "";
  return sortDirection.value === "asc" ? "▲" : "▼";
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

const selectedPaths = ref<string[]>([]);
const lastSelectedIndex = ref<number | null>(null);

function selectEntry(entry: FileEntry, index: number, event: MouseEvent) {
  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index);
    const end = Math.max(lastSelectedIndex.value, index);

    selectedPaths.value = sortedEntries.value
      .slice(start, end + 1)
      .map(item => item.path);
  } else if (event.metaKey || event.ctrlKey) {
    if (selectedPaths.value.includes(entry.path)) {
      selectedPaths.value = selectedPaths.value.filter(path => path !== entry.path);
    } else {
      selectedPaths.value = [...selectedPaths.value, entry.path];
    }

    lastSelectedIndex.value = index;
  } else {
    selectedPaths.value = [entry.path];
    lastSelectedIndex.value = index;
  }

  emitSelection();
}

function emitSelection() {
  const selected = sortedEntries.value.filter(entry =>
    selectedPaths.value.includes(entry.path)
  );

  emit("selectionChange", selected);
}
</script>

<style scoped>
.explorer {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.explorer-header {
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  border-bottom: 1px solid #444;
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

tr:hover {
  background: #333;
}

.error {
  color: #ff7777;
  padding: 8px;
}

.empty {
  padding: 20px;
  color: #aaa;
}
tr.selected {
  background: #1f5f99;
}

tr.selected:hover {
  background: #2670b8;
}
</style>