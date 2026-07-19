import { computed } from "vue";
import { useTabStore } from "../stores/tabStore";
import { useTransferStore } from "../stores/transferStore";

export function useTransferPopup(tabId: string) {
  const tabStore = useTabStore();
  const transferStore = useTransferStore();
  const tab = computed(() => tabStore.tabsById[tabId]);
  const items = computed(() => transferStore.itemsForTab(tabId)
    .filter(item => tab.value.watchStartedAt !== null && item.createdAt >= tab.value.watchStartedAt)
    .sort((a, b) => a.createdAt - b.createdAt));
  const completedCount = computed(() => items.value.filter(item => item.status === "completed").length);
  const currentItem = computed(() => items.value.find(item => item.status === "running") || items.value.find(item => item.status === "queued") || null);
  const failedCount = computed(() => items.value.filter(item => item.status === "failed").length);
  const pendingCount = computed(() => items.value.filter(item => ["queued", "running"].includes(item.status)).length);
  const overallProgress = computed(() => {
    if (!items.value.length) return 0;
    const total = items.value.reduce((sum, item) => sum + Math.max(item.totalBytes, 1), 0);
    const done = items.value.reduce((sum, item) => sum + (item.status === "completed" ? Math.max(item.totalBytes, 1) : item.bytesTransferred), 0);
    return Math.round((done / total) * 100);
  });
  const summary = computed(() => tab.value.watching
    ? pendingCount.value ? "Transferring detected file changes..." : "Watching the local directory for changes..."
    : "Directory watching stopped");
  const closeLabel = computed(() => tab.value.watching || pendingCount.value ? "Hide" : "Close");
  const idleMessage = computed(() => tab.value.watching ? "Watching for local file changes." : "No file is currently being transferred.");

  async function stopWatchSync() {
    await window.macscp.watch.stop(tabId);
    tab.value.watching = false;
  }
  function closePopup() { tab.value.transferPopupVisible = false; }

  return { tab, currentItem, completedCount, failedCount, pendingCount, overallProgress, summary, closeLabel, idleMessage, stopWatchSync, closePopup };
}
