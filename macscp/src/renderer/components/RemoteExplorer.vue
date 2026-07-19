<template>
  <Explorer
    title="Remote"
    :status="connected ? explorer.currentPath.value : 'Not connected'"
    :entries="explorer.entries.value"
    :current-path="explorer.currentPath.value"
    :error="explorer.error.value"
    :empty-message="connected ? '' : 'Not connected'"
    :can-go-parent="
      connected &&
      explorer.currentPath.value !== '.' &&
      explorer.currentPath.value !== '/'
    "
    @open="handleOpen"
    @refresh="explorer.refresh"
    @go-parent="explorer.goParent"
    @go-path="explorer.goToPath"
    @selection-change="explorer.setSelection"
    :compare-entries="tab.compareVisible ? tab.compareEntries : []"
    side="remote"
    @context-action="handleContextAction"
    @drag-start="handleDragStart"
@drop-items="handleDropItems"
  />
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import type { FileEntry } from "../../shared/filesystem/FileEntry";
import Explorer from "./explorer/Explorer.vue";
import { useExplorer } from "../composables/useExplorer";
import { useRefreshStore } from "../stores/refreshStore";
import { useDragStore } from "../stores/dragStore";
import { joinRemotePath } from "../../shared/utils/remotePath";
import { useTabStore } from "../stores/tabStore";
import { deleteConfirmation } from "../utils/deleteConfirmation";
import { runWithConcurrency } from "../../shared/utils/runWithConcurrency";
import { isIgnored } from "../../shared/utils/ignorePatterns";
import { relativePath } from "../../shared/utils/relativePath";
import { useEditorStore } from "../stores/editorStore";
const props = defineProps<{ tabId: string }>();
const tabStore = useTabStore();
const tab = computed(() => tabStore.tabsById[props.tabId]);
const connected = computed(() => tab.value.connection.state === "connected");
const editorStore = useEditorStore();
const dragStore = useDragStore();

const explorer = useExplorer({
  side: "remote",
  initialPath: ".",
  listDirectory: (path) => window.macscp.sftp.listDirectory(props.tabId, path),
  onPathChange: path => {
  tab.value.remotePath = path;
},
  onSelectionChange: (entries) => { tab.value.remoteSelection = entries; },
});

const refreshStore = useRefreshStore();

watch(
  () => refreshStore.remoteRefreshTokens[props.tabId],
  () => {
    if (connected.value) {
      explorer.refresh();
    }
  }
);

async function handleConnected() {
  const remotePath = tab.value.remotePath || ".";
  await explorer.load(remotePath);
}

watch(connected, value => { if (value) void handleConnected(); });

function handleOpen(entry: FileEntry) {
  if (entry.type === "directory") {
    explorer.open(entry);
  } else if (entry.type === "file") {
    void editorStore.open(props.tabId, "remote", entry);
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

async function handleContextAction(payload: { action: string; entry: FileEntry }) {
  if (payload.action === "refresh") {
    explorer.refresh();
    return;
  }

  if (payload.action === "download") {
    if (payload.entry.type === "file") {
      await queueDownloadFile(
        payload.entry,
        `${tab.value.localPath.replace(/\/$/, "")}/${payload.entry.name}`
      );
    }

    if (payload.entry.type === "directory") {
      const files = await window.macscp.sftp.walkDirectory(props.tabId, payload.entry.path);

      for (const file of files) {
        if (file.type !== "file") continue;

        const downloadRelativePath = file.path.replace(
          payload.entry.path.replace(/\/$/, "") + "/",
          ""
        );
        const localTarget = `${tab.value.localPath.replace(/\/$/, "")}/${
          payload.entry.name
        }/${downloadRelativePath}`;

        await queueDownloadFile(file, localTarget);
      }
    }
  }

  if (payload.action === "delete") {
    const entries = tab.value.remoteSelection.some(item => item.path === payload.entry.path)
      ? tab.value.remoteSelection
      : [payload.entry];
    if (!window.confirm(deleteConfirmation(entries, "remote"))) return;

    try {
      await runWithConcurrency(entries, 4, entry =>
        window.macscp.sftp.delete(props.tabId, entry.path, entry.type)
      );
      explorer.setSelection([]);
      await explorer.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to delete remote item");
    }
  }
}

function handleDragStart(entry: FileEntry) {
  const selected = tab.value.remoteSelection.some(item => item.path === entry.path)
    ? tab.value.remoteSelection
    : [entry];

  dragStore.start(props.tabId, "remote", selected);
}

async function handleDropItems() {
  if (dragStore.tabId !== props.tabId || dragStore.source !== "local") return;

  for (const entry of dragStore.entries) {
    await uploadEntry(entry);
  }

  dragStore.clear();
}

async function uploadEntry(entry: FileEntry) {
  if (entry.type === "file") {
    await queueUploadFile(
      entry,
      joinRemotePath(tab.value.remotePath, entry.name)
    );
  }

  if (entry.type === "directory") {
    const files = await window.macscp.local.walkDirectory(entry.path);

    for (const file of files) {
      if (file.type !== "file") continue;
      if (isIgnored(relativePath(file.path, tab.value.localPath), tab.value.ignorePatterns)) continue;

      const uploadRelativePath = file.path.replace(entry.path.replace(/\/$/, "") + "/", "");
      const remoteTarget = joinRemotePath(
        joinRemotePath(tab.value.remotePath, entry.name),
        uploadRelativePath
      );

      await queueUploadFile(file, remoteTarget);
    }
  }
}

async function queueUploadFile(entry: FileEntry, targetPath: string) {
  await window.macscp.transfers.enqueue({
    id: crypto.randomUUID(),
    tabId: props.tabId,
    queueId: tab.value.transferQueueId,
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
