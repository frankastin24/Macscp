<template>
  <section v-if="store.visible" class="compare-panel">
    <header>
      <strong>Directory Comparison</strong>

      <div>
        <span v-if="store.loading">Comparing...</span>
        <button @click="store.close">Close</button>
      </div>
    </header>

    <div v-if="store.error" class="error">{{ store.error }}</div>

    <table v-else>
      <thead>
        <tr>
          <th>Status</th>
          <th>Name</th>
          <th>Local Size</th>
          <th>Remote Size</th>
          <th>Local Modified</th>
          <th>Remote Modified</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="entry in store.entries" :key="entry.name" :class="entry.status">
          <td>{{ label(entry.status) }}</td>
          <td>{{ entry.name }}</td>
          <td>{{ entry.local ? formatSize(entry.local.size) : "-" }}</td>
          <td>{{ entry.remote ? formatSize(entry.remote.size) : "-" }}</td>
          <td>{{ entry.local ? formatDate(entry.local.modifiedAt) : "-" }}</td>
          <td>{{ entry.remote ? formatDate(entry.remote.modifiedAt) : "-" }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import type { CompareStatus } from "../../../shared/compare/CompareEntry";
import { useCompareStore } from "../../stores/compareStore";

const store = useCompareStore();

function label(status: CompareStatus) {
  const labels: Record<CompareStatus, string> = {
    identical: "✓ Same",
    "local-only": "↑ Local only",
    "remote-only": "↓ Remote only",
    "local-newer": "↑ Local newer",
    "remote-newer": "↓ Remote newer",
    different: "⚠ Different",
  };

  return labels[status];
}

import { formatSize } from "../../../shared/utils/formatSize";
import { formatDate } from "../../../shared/utils/formatDate";
</script>

<style scoped>
.compare-panel {
  height: 220px;
  border-top: 1px solid #444;
  background: #181818;
  display: flex;
  flex-direction: column;
}

header {
  height: 34px;
  background: #252525;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
}

button {
  margin-left: 10px;
  background: #333;
  color: white;
  border: 1px solid #555;
  padding: 4px 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

th,
td {
  padding: 6px 8px;
  border-bottom: 1px solid #333;
  text-align: left;
}

.identical {
  color: #999;
}

.local-only,
.local-newer {
  color: #7ec8ff;
}

.remote-only,
.remote-newer {
  color: #ffc66d;
}

.different {
  color: #ff7777;
}

.error {
  color: #ff7777;
  padding: 8px;
}
</style>