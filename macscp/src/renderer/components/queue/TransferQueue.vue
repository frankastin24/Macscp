<template>
  <section class="queue">
    <header class="queue-header">
      <strong>Transfer Queue</strong>

      <div class="actions">
        <span>{{ store.items.length }} items</span>
        <button @click="store.clearCompleted">Clear Completed</button>
      </div>
    </header>

    <div v-if="store.items.length === 0" class="empty">
      No transfers
    </div>

    <table v-else>
      <thead>
        <tr>
          <th>Direction</th>
          <th>File</th>
          <th>Status</th>
          <th>Progress</th>
          <th>Source</th>
          <th>Target</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in store.items" :key="item.id">
          <td>{{ item.direction }}</td>
          <td>{{ item.filename }}</td>
          <td>{{ item.status }}</td>
          <td>{{ item.progress }}%</td>
          <td>{{ item.sourcePath }}</td>
          <td>{{ item.targetPath }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { useTransferStore } from "../../../stores/transferStore";

const store = useTransferStore();

import { onMounted, onUnmounted } from "vue";

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = window.macscp.transfers.onProgress(item => {
    store.upsert(item);
  });
});

onUnmounted(() => {
  unsubscribe?.();
});
</script>

<style scoped>
.queue {
  height: 170px;
  border-top: 1px solid #444;
  background: #1d1d1d;
  display: flex;
  flex-direction: column;
}

.queue-header {
  height: 34px;
  padding: 0 10px;
  background: #252525;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

button {
  background: #333;
  color: white;
  border: 1px solid #555;
  padding: 4px 8px;
}

.empty {
  padding: 16px;
  color: #aaa;
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
</style>