<template>
  <Explorer
    title="Local"
    :status="explorer.currentPath.value"
    :entries="explorer.entries.value"
    :current-path="explorer.currentPath.value"
    :error="explorer.error.value"
    :can-go-parent="
      explorer.currentPath.value !== 'Home' && explorer.currentPath.value !== '/'
    "
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
import { watch } from "vue";
import { useRefreshStore } from "../stores/refreshStore";
import Explorer from "./Explorer.vue";
import { useExplorer } from "../composables/useExplorer";
import { useExplorerStore } from "../stores/explorerStore";
import { useCompareStore } from "../stores/compareStore";
import { joinRemotePath } from "../../shared/utils/remotePath";
const refreshStore = useRefreshStore();

const explorerStore = useExplorerStore();
const compareStore = useCompareStore();
const explorer = useExplorer({
  side: "local",
  initialPath: "Home",
  listDirectory: (path) =>
    window.macscp.local.listDirectory(path === "Home" ? undefined : path),
  onPathChange: (path) => explorerStore.setLocalPath(path),
  onSelectionChange: (entries) => explorerStore.setLocalSelection(entries),
});

watch(
  () => refreshStore.localRefreshToken,
  () => {
    explorer.refresh();
  }
);

onMounted(() => explorer.load());

async function queueUploadFile(
  entry: FileEntry,
  remoteBaseOrFullPath: string,
  fullTarget = false
) {
  await window.macscp.transfers.enqueue({
    id: crypto.randomUUID(),
    direction: "upload",
    sourcePath: entry.path,
    targetPath: fullTarget
      ? remoteBaseOrFullPath
      : joinRemotePath(remoteBaseOrFullPath, entry.name),
    filename: entry.name,
    status: "queued",
    progress: 0,
    bytesTransferred: 0,
    totalBytes: entry.size,
    createdAt: Date.now(),
  });
}

async function handleContextAction(payload: { action: string; entry: FileEntry }) {
  if (payload.action === "refresh") {
    explorer.refresh();
    return;
  }

  if (payload.action === "upload") {
    if (payload.entry.type === "file") {
      await queueUploadFile(payload.entry, explorerStore.remotePath);
    }

    if (payload.entry.type === "directory") {
      const files = await window.macscp.local.walkDirectory(payload.entry.path);

      for (const file of files) {
        if (file.type !== "file") continue;

        const relativePath = file.path.replace(payload.entry.path + "/", "");
        const remoteTarget = joinRemotePath(
          joinRemotePath(explorerStore.remotePath, payload.entry.name),
          relativePath
        );

        await queueUploadFile(file, remoteTarget, true);
      }
    }
  }
}
</script>
