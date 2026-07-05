<template>
  <footer class="statusbar">
    <span>{{ connection }}</span>
    <span>Local: {{ explorerStore.localPath }}</span>
    <span>Remote: {{ explorerStore.remotePath }}</span>
    <span>{{ transferStore.runningCount }} running</span>
    <span>{{ transferStore.queuedCount }} queued</span>
    <span>Local selected: {{ explorerStore.localSelection.length }}</span>
    <span>Remote selected: {{ explorerStore.remoteSelection.length }}</span>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useExplorerStore } from "../stores/explorerStore";
import { useTransferStore } from "../stores/transferStore";

const explorerStore = useExplorerStore();
const transferStore = useTransferStore();

const connection = computed(() =>
  explorerStore.remoteConnected ? "Connected" : "Not connected"
);
</script>

<style scoped>
.statusbar {
  height: 28px;
  background: #222;
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 10px;
  font-size: 12px;
  border-top: 1px solid #444;
}
</style>