import { computed, ref } from "vue";
import { useTabStore } from "../stores/tabStore";
import { useDirectorySync } from "./useDirectorySync";

export function useConnectionPanel(tabId: string) {
  const tabStore = useTabStore();
  const tab = computed(() => tabStore.tabsById[tabId]);
  const { syncCompared, waitForTransfers } = useDirectorySync(tabId);
  const loading = ref(false);
  const status = ref("");

  async function connect() {
    const current = tab.value;
    loading.value = true;
    current.connection.state = "connecting";
    current.connection.error = "";
    try {
      await window.macscp.sftp.connect(tabId, {
        host: current.connection.host,
        port: current.connection.port,
        username: current.connection.username,
        password: current.connection.password,
        privateKey: current.connection.privateKey,
      });
      current.connection.state = "connected";
      current.title = current.sessionId ? current.title : `${current.connection.username}@${current.connection.host}`;
      status.value = "Connected successfully";
    } catch (error) {
      current.connection.state = "error";
      current.connection.error = message(error, "Connection failed");
      status.value = current.connection.error;
    } finally {
      loading.value = false;
    }
  }

  async function startWatchSync() {
    const current = tab.value;
    if (!current.localPath || current.localPath === "Home") {
      status.value = "Choose a real local folder before starting watch sync";
      return;
    }
    if (current.connection.state !== "connected") {
      status.value = "Connect this tab before starting watch sync";
      return;
    }

    try {
      const initialSync = window.confirm("Do you want to perform an initial sync before watching these directories?");
      current.watchStartedAt = Date.now();
      current.watching = true;
      current.transferPopupVisible = true;
      if (initialSync) {
        const ids = await syncCompared(true);
        status.value = ids.length ? `Initial sync started (${ids.length} transfers)` : "Directories are already in sync";
        await waitForTransfers(ids);
      }
      await window.macscp.watch.start({
        tabId,
        queueId: current.transferQueueId,
        localPath: current.localPath,
        remotePath: current.remotePath,
        ignorePatterns: current.ignorePatterns,
      });
      status.value = "Watch sync started";
    } catch (error) {
      current.watching = false;
      status.value = message(error, "Failed to start watch sync");
    }
  }

  return { tab, loading, status, connect, syncCompared, startWatchSync };
}

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
