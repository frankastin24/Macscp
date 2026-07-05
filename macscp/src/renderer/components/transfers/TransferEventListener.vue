<template></template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useTransferStore } from "../../stores/transferStore";
import { useRefreshStore } from "../../stores/refreshStore";
import { useExplorerStore } from "../../stores/explorerStore";
import { useCompareStore } from "../../stores/compareStore";
const explorerStore = useExplorerStore();
const compareStore = useCompareStore();

const store = useTransferStore();
const refreshStore = useRefreshStore();

const completedTransfers = new Set<string>();
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = window.macscp.transfers.onProgress(item => {
    store.upsert(item);

    if (item.status === "completed" && !completedTransfers.has(item.id)) {
      completedTransfers.add(item.id);

      if (item.direction === "upload") {
        refreshStore.refreshRemote();
      }

      if (item.direction === "download") {
        refreshStore.refreshLocal();
      }
      compareStore.autoCompare(
  explorerStore.localPath,
  explorerStore.remotePath,
  explorerStore.remoteConnected
);
    }
  });
});

onUnmounted(() => {
  unsubscribe?.();
});
</script>