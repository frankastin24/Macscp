<template>
  <Explorer
    title="Remote"
    :status="explorerStore.remoteConnected ? explorer.currentPath.value : 'Not connected'"
    :entries="explorer.entries.value"
    :current-path="explorer.currentPath.value"
    :error="explorer.error.value"
    :empty-message="explorerStore.remoteConnected ? '' : 'Not connected'"
    :can-go-parent="explorerStore.remoteConnected && explorer.currentPath.value !== '.' && explorer.currentPath.value !== '/'"
    @open="explorer.open"
    @refresh="explorer.refresh"
    @go-parent="explorer.goParent"
    @go-path="explorer.goToPath"
    @selection-change="explorer.setSelection"
    :compare-entries="compareStore.visible ? compareStore.entries : []"
    side="remote"
@context-action="handleContextAction"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import Explorer from "./Explorer.vue";
import { useExplorer } from "../composables/useExplorer";
import { useExplorerStore } from "../stores/explorerStore";
import { useCompareStore } from "../stores/compareStore";
import { watch } from "vue";
import { useRefreshStore } from "../stores/refreshStore";
const compareStore = useCompareStore();
const explorerStore = useExplorerStore();

const explorer = useExplorer({
  side: "remote",
  initialPath: ".",
  listDirectory: path => window.macscp.sftp.listDirectory(path),
  onPathChange: path => explorerStore.setRemotePath(path),
  onSelectionChange: entries => explorerStore.setRemoteSelection(entries),
});

const refreshStore = useRefreshStore();

watch(
  () => refreshStore.remoteRefreshToken,
  () => {
    if (explorerStore.remoteConnected) {
      explorer.refresh();
    }
  }
);

async function handleConnected() {
  explorerStore.setRemoteConnected(true);
  await explorer.load(".");
}

onMounted(() => {
  window.addEventListener("macscp:sftp-connected", handleConnected);
});

onUnmounted(() => {
  window.removeEventListener("macscp:sftp-connected", handleConnected);
});
async function handleContextAction(payload: { action: string; entry: FileEntry }) {
  if (payload.action === "refresh") {
    explorer.refresh();
    return;
  }

  if (payload.action === "download" && payload.entry.type === "file") {
    await window.macscp.transfers.enqueue({
      id: crypto.randomUUID(),
      direction: "download",
      sourcePath: payload.entry.path,
      targetPath: `${explorerStore.localPath.replace(/\/$/, "")}/${payload.entry.name}`,
      filename: payload.entry.name,
      status: "queued",
      progress: 0,
      bytesTransferred: 0,
      totalBytes: payload.entry.size,
      createdAt: Date.now(),
    });
  }
}
</script>