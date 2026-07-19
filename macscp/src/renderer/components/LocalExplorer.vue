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
    @open="handleOpen"
    @refresh="explorer.refresh"
    @go-parent="explorer.goParent"
    @go-path="explorer.goToPath"
    @selection-change="explorer.setSelection"
    :compare-entries="tab.compareVisible ? tab.compareEntries : []"
    side="local"
    @context-action="handleContextAction"
    @drag-start="handleDragStart"
@drop-items="handleDropItems"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import type { FileEntry } from "../../shared/filesystem/FileEntry";
import { useRefreshStore } from "../stores/refreshStore";
import Explorer from "./explorer/Explorer.vue";
import { useExplorer } from "../composables/useExplorer";
import { joinRemotePath } from "../../shared/utils/remotePath";
import { useDragStore } from "../stores/dragStore";
import { useTabStore } from "../stores/tabStore";
import { deleteConfirmation } from "../utils/deleteConfirmation";
import { runWithConcurrency } from "../../shared/utils/runWithConcurrency";
import { isIgnored } from "../../shared/utils/ignorePatterns";
import { relativePath } from "../../shared/utils/relativePath";
import { useEditorStore } from "../stores/editorStore";
const props = defineProps<{ tabId: string }>();
const refreshStore = useRefreshStore();

const tabStore = useTabStore();
const tab = computed(() => tabStore.tabsById[props.tabId]);
const editorStore = useEditorStore();
const dragStore = useDragStore();
const explorer = useExplorer({
  side: "local",
  initialPath: "Home",
  listDirectory: (path) =>
    window.macscp.local.listDirectory(path === "Home" ? undefined : path),
  onPathChange: path => {
  tab.value.localPath = path;
},
  onSelectionChange: (entries) => { tab.value.localSelection = entries; },
});

watch(
  () => refreshStore.localRefreshTokens[props.tabId],
  () => {
    explorer.refresh();
  }
);

onMounted(() => {
  explorer.load(tab.value.localPath === "Home" ? undefined : tab.value.localPath);
});

function handleOpen(entry: FileEntry) {
  if (entry.type === "directory") {
    explorer.open(entry);
  } else if (entry.type === "file") {
    void editorStore.open(props.tabId, "local", entry);
  }
}

async function queueUploadFile(
  entry: FileEntry,
  remoteBaseOrFullPath: string,
  fullTarget = false
) {
  await window.macscp.transfers.enqueue({
    id: crypto.randomUUID(),
    tabId: props.tabId,
    queueId: tab.value.transferQueueId,
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
      await queueUploadFile(payload.entry, tab.value.remotePath);
    }

    if (payload.entry.type === "directory") {
      const files = await window.macscp.local.walkDirectory(payload.entry.path);

      for (const file of files) {
        if (file.type !== "file") continue;
        if (isIgnored(relativePath(file.path, tab.value.localPath), tab.value.ignorePatterns)) continue;

        const uploadRelativePath = file.path.replace(payload.entry.path + "/", "");
        const remoteTarget = joinRemotePath(
          joinRemotePath(tab.value.remotePath, payload.entry.name),
          uploadRelativePath
        );

        await queueUploadFile(file, remoteTarget, true);
      }
    }
  }

  if (payload.action === "delete") {
    const entries = tab.value.localSelection.some(item => item.path === payload.entry.path)
      ? tab.value.localSelection
      : [payload.entry];
    if (!window.confirm(deleteConfirmation(entries, "local"))) return;

    try {
      await runWithConcurrency(entries, 4, entry => window.macscp.local.delete(entry.path));
      explorer.setSelection([]);
      await explorer.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to delete local item");
    }
  }
}

function handleDragStart(entry: FileEntry) {
  const selected = tab.value.localSelection.some(item => item.path === entry.path)
    ? tab.value.localSelection
    : [entry];

  dragStore.start(props.tabId, "local", selected);
}

async function handleDropItems() {
  if (dragStore.tabId !== props.tabId || dragStore.source !== "remote") return;

  for (const entry of dragStore.entries) {
    await downloadEntry(entry);
  }

  dragStore.clear();
}

async function downloadEntry(entry: FileEntry) {
  if (entry.type === "file") {
    await queueDownloadFile(
      entry,
      `${tab.value.localPath.replace(/\/$/, "")}/${entry.name}`
    );
  }

  if (entry.type === "directory") {
    const files = await window.macscp.sftp.walkDirectory(props.tabId, entry.path);

    for (const file of files) {
      if (file.type !== "file") continue;

      const downloadRelativePath = file.path.replace(entry.path.replace(/\/$/, "") + "/", "");
      const localTarget = `${tab.value.localPath.replace(/\/$/, "")}/${entry.name}/${downloadRelativePath}`;

      await queueDownloadFile(file, localTarget);
    }
  }
}

async function queueDownloadFile(entry: FileEntry, targetPath: string) {
  await window.macscp.transfers.enqueue({
    id: crypto.randomUUID(),
    tabId: props.tabId,
    queueId: tab.value.transferQueueId,
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
