<template>
  <Explorer
    title="Remote"
    :status="explorerStore.remoteConnected ? explorer.currentPath.value : 'Not connected'"
    :entries="explorer.entries.value"
    :current-path="explorer.currentPath.value"
    :error="explorer.error.value"
    :empty-message="explorerStore.remoteConnected ? '' : 'Not connected'"
    :can-go-parent="
      explorerStore.remoteConnected &&
      explorer.currentPath.value !== '.' &&
      explorer.currentPath.value !== '/'
    "
    @open="explorer.open"
    @refresh="explorer.refresh"
    @go-parent="explorer.goParent"
    @go-path="explorer.goToPath"
    @selection-change="explorer.setSelection"
    :compare-entries="compareStore.visible ? compareStore.entries : []"
    side="remote"
    @context-action="handleContextAction"
    @drag-start="handleDragStart"
@drop-items="handleDropItems"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import Explorer from "./explorer/Explorer.vue";
import { useExplorer } from "../composables/useExplorer";
import { useExplorerStore } from "../stores/explorerStore";
import { useCompareStore } from "../stores/compareStore";
import { watch } from "vue";
import { useRefreshStore } from "../stores/refreshStore";
import { useDragStore } from "../stores/dragStore";
import { joinRemotePath } from "../../shared/utils/remotePath";
const compareStore = useCompareStore();
const explorerStore = useExplorerStore();
const dragStore = useDragStore();

const explorer = useExplorer({
  side: "remote",
  initialPath: ".",
  listDirectory: (path) => window.macscp.sftp.listDirectory(path),
  onPathChange: path => {
  explorerStore.setRemotePath(path);
  compareStore.autoCompare(
    explorerStore.localPath,
    path,
    explorerStore.remoteConnected
  );
},
  onSelectionChange: (entries) => explorerStore.setRemoteSelection(entries),
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
  const remotePath = explorerStore.remotePath || ".";
  explorerStore.setRemoteConnected(true);
  await explorer.load(remotePath);
}

onMounted(() => {
  window.addEventListener("macscp:sftp-connected", handleConnected);
});

onUnmounted(() => {
  window.removeEventListener("macscp:sftp-connected", handleConnected);
});

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

async function handleContextAction(payload: { action: string; entry: FileEntry }) {
  if (payload.action === "refresh") {
    explorer.refresh();
    return;
  }

  if (payload.action === "download") {
    if (payload.entry.type === "file") {
      await queueDownloadFile(
        payload.entry,
        `${explorerStore.localPath.replace(/\/$/, "")}/${payload.entry.name}`
      );
    }

    if (payload.entry.type === "directory") {
      const files = await window.macscp.sftp.walkDirectory(payload.entry.path);

      for (const file of files) {
        if (file.type !== "file") continue;

        const relativePath = file.path.replace(
          payload.entry.path.replace(/\/$/, "") + "/",
          ""
        );
        const localTarget = `${explorerStore.localPath.replace(/\/$/, "")}/${
          payload.entry.name
        }/${relativePath}`;

        await queueDownloadFile(file, localTarget);
      }
    }
  }
}
function handleDragStart(entry: FileEntry) {
  const selected = explorerStore.remoteSelection.some(item => item.path === entry.path)
    ? explorerStore.remoteSelection
    : [entry];

  dragStore.start("remote", selected);
}

async function handleDropItems() {
  if (dragStore.source !== "local") return;

  for (const entry of dragStore.entries) {
    await uploadEntry(entry);
  }

  dragStore.clear();
}

async function uploadEntry(entry: FileEntry) {
  if (entry.type === "file") {
    await queueUploadFile(
      entry,
      joinRemotePath(explorerStore.remotePath, entry.name)
    );
  }

  if (entry.type === "directory") {
    const files = await window.macscp.local.walkDirectory(entry.path);

    for (const file of files) {
      if (file.type !== "file") continue;

      const relativePath = file.path.replace(entry.path.replace(/\/$/, "") + "/", "");
      const remoteTarget = joinRemotePath(
        joinRemotePath(explorerStore.remotePath, entry.name),
        relativePath
      );

      await queueUploadFile(file, remoteTarget);
    }
  }
}

async function queueUploadFile(entry: FileEntry, targetPath: string) {
  await window.macscp.transfers.enqueue({
    id: crypto.randomUUID(),
    direction: "upload",
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
