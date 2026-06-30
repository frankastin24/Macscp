<template>
  <Explorer
    title="Local"
    :status="explorer.currentPath.value"
    :entries="explorer.entries.value"
    :current-path="explorer.currentPath.value"
    :error="explorer.error.value"
    :can-go-parent="explorer.currentPath.value !== 'Home' && explorer.currentPath.value !== '/'"
    @open="explorer.open"
    @refresh="explorer.refresh"
    @go-parent="explorer.goParent"
    @go-path="explorer.goToPath"
    @selection-change="explorer.setSelection"
    :compare-entries="compareStore.visible ? compareStore.entries : []"
    side="local"
@context-action="handleContextAction"
  />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import Explorer from "./Explorer.vue";
import { useExplorer } from "../composables/useExplorer";
import { useExplorerStore } from "../stores/explorerStore";
import { useCompareStore } from "../stores/compareStore";
import { joinRemotePath } from "../../shared/utils/remotePath";
const explorerStore = useExplorerStore();
const compareStore = useCompareStore();
const explorer = useExplorer({
  side: "local",
  initialPath: "Home",
  listDirectory: path => window.macscp.local.listDirectory(path === "Home" ? undefined : path),
  onPathChange: path => explorerStore.setLocalPath(path),
  onSelectionChange: entries => explorerStore.setLocalSelection(entries),
});

onMounted(() => explorer.load());

async function handleContextAction(payload: { action: string; entry: FileEntry }) {
  if (payload.action === "refresh") {
    explorer.refresh();
    return;
  }

  if (payload.action === "upload" && payload.entry.type === "file") {
    await window.macscp.transfers.enqueue({
      id: crypto.randomUUID(),
      direction: "upload",
      sourcePath: payload.entry.path,
      targetPath: joinRemotePath(explorerStore.remotePath, payload.entry.name),
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