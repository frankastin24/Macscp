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
    @drag-start="handleDragStart"
@drop-items="handleDropItems"
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
import { useDragStore } from "../stores/dragStore";
const refreshStore = useRefreshStore();

const explorerStore = useExplorerStore();
const compareStore = useCompareStore();
const dragStore = useDragStore();
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
function handleDragStart(entry: FileEntry) {
  const selected = explorerStore.localSelection.some(item => item.path === entry.path)
    ? explorerStore.localSelection
    : [entry];

  dragStore.start("local", selected);
}

async function handleDropItems() {
  if (dragStore.source !== "remote") return;

  for (const entry of dragStore.entries) {
    await downloadEntry(entry);
  }

  dragStore.clear();
}

async function downloadEntry(entry: FileEntry) {
  if (entry.type === "file") {
    await queueDownloadFile(
      entry,
      `${explorerStore.localPath.replace(/\/$/, "")}/${entry.name}`
    );
  }

  if (entry.type === "directory") {
    const files = await window.macscp.sftp.walkDirectory(entry.path);

    for (const file of files) {
      if (file.type !== "file") continue;

      const relativePath = file.path.replace(entry.path.replace(/\/$/, "") + "/", "");
      const localTarget = `${explorerStore.localPath.replace(/\/$/, "")}/${entry.name}/${relativePath}`;

      await queueDownloadFile(file, localTarget);
    }
  }
}

async function queueDownloadFile(entry: FileEntry, targetPath: string) {
  await window.macscp.transfers.enqueue({
    id: crypto.randomUUID(),
    direction: "download",
    sourcePath: entry.path,
    targetPath,
    filename: entry.name,
    status: "queued",
    progress: 0,
    bytesTransferred: 0,
    totalBytes: entry.size,
    createdAt: Date.now(),
  });
}
</script>
