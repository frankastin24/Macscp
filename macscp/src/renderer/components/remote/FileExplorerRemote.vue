<template>
  <section class="explorer">
    <div class="explorer-toolbar">
      <button @click="$emit('go-parent')">⬆</button>
      <button @click="$emit('refresh')">⟳</button>
      <input v-model="pathInput" @keyup.enter="$emit('go-path', pathInput)" />
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Size</th>
          <th>Modified</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="entry in entries" :key="entry.path" @dblclick="$emit('open', entry)">
          <td>{{ icon(entry.type) }} {{ entry.name }}</td>
          <td>{{ entry.type === "directory" ? "" : formatSize(entry.size) }}</td>
          <td>{{ formatDate(entry.modifiedAt) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { FileEntry } from "../../../shared/filesystem/FileEntry";

const props = defineProps<{
  entries: FileEntry[];
  currentPath: string;
  error: string;
}>();

defineEmits<{
  open: [entry: FileEntry];
  refresh: [];
  goParent: [];
  goPath: [path: string];
}>();

const pathInput = ref(props.currentPath);

watch(
  () => props.currentPath,
  (value) => {
    pathInput.value = value;
  }
);

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

tr:hover {
  background: #333;
}

.error {
  color: #ff7777;
  padding: 8px;
}
</style>