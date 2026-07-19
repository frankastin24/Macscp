<template></template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useTransferStore } from "../../stores/transferStore";
import { useRefreshStore } from "../../stores/refreshStore";
import { useTabStore } from "../../stores/tabStore";
const tabStore = useTabStore();

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
        refreshStore.refreshRemote(item.tabId);
      }

      if (item.direction === "download") {
        refreshStore.refreshLocal(item.tabId);
      }
      const tab = tabStore.tabsById[item.tabId];
      if (tab?.connection.state === "connected") {
        void window.macscp.compare.directories(item.tabId, tab.localPath, tab.remotePath)
          .then(entries => {
            if (!tabStore.tabsById[item.tabId]) return;
            tab.compareEntries = entries;
            tab.compareVisible = true;
          });
      }
    }
  });
});

onUnmounted(() => {
  unsubscribe?.();
});
</script>
