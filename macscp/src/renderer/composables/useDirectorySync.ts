import { watch } from "vue";
import type { FileEntry } from "../../shared/filesystem/FileEntry";
import { joinRemotePath } from "../../shared/utils/remotePath";
import { useTabStore } from "../stores/tabStore";
import { useTransferStore } from "../stores/transferStore";
import { isIgnored } from "../../shared/utils/ignorePatterns";
import { relativePath } from "../../shared/utils/relativePath";

export function useDirectorySync(tabId: string) {
  const tabStore = useTabStore();
  const transferStore = useTransferStore();
  const getTab = () => tabStore.tabsById[tabId];

  async function enqueueUpload(entry: FileEntry, relativeFilePath: string) {
    const tab = getTab();
    const id = crypto.randomUUID();
    const item = await window.macscp.transfers.enqueue({
      id,
      tabId,
      queueId: tab.transferQueueId,
      direction: "upload",
      sourcePath: entry.path,
      targetPath: joinRemotePath(tab.remotePath, relativeFilePath),
      filename: relativeFilePath,
      status: "queued",
      progress: 0,
      bytesTransferred: 0,
      totalBytes: entry.size,
      createdAt: Date.now(),
    });
    transferStore.upsert(item);
    return id;
  }

  async function syncCompared(recursive = false) {
    if (recursive) return syncDirectoryTrees();
    const tab = getTab();
    tab.compareEntries = await window.macscp.compare.directories(tabId, tab.localPath, tab.remotePath);
    tab.compareVisible = true;
    const ids: string[] = [];
    for (const entry of tab.compareEntries) {
      if (
        entry.status !== "identical" &&
        entry.local?.type === "file" &&
        !isIgnored(entry.local.name, tab.ignorePatterns)
      ) {
        ids.push(await enqueueUpload(entry.local, entry.local.name));
      }
    }
    return ids;
  }

  async function syncDirectoryTrees() {
    const tab = getTab();
    const [localTree, remoteTree] = await Promise.all([
      window.macscp.local.walkDirectory(tab.localPath),
      window.macscp.sftp.walkDirectory(tabId, tab.remotePath),
    ]);
    const localFiles = fileMap(localTree, tab.localPath, tab.ignorePatterns);
    const remoteFiles = fileMap(remoteTree, tab.remotePath);
    const ids: string[] = [];
    for (const path of [...localFiles.keys()].sort()) {
      const local = localFiles.get(path)!;
      const remote = remoteFiles.get(path);
      if (!remote || local.size !== remote.size || Math.abs(local.modifiedAt - remote.modifiedAt) >= 2000) {
        ids.push(await enqueueUpload(local, path));
      }
    }
    return ids;
  }

  function waitForTransfers(idsToWaitFor: string[]) {
    if (!idsToWaitFor.length) return Promise.resolve();
    const ids = new Set(idsToWaitFor);
    const finished = () => transferStore.items
      .filter(item => ids.has(item.id))
      .every(item => ["completed", "failed", "cancelled"].includes(item.status));
    if (finished()) return Promise.resolve();
    return new Promise<void>(resolve => {
      const stop = watch(finished, done => {
        if (!done) return;
        stop();
        resolve();
      });
    });
  }

  return { syncCompared, waitForTransfers };
}

function fileMap(entries: FileEntry[], rootPath: string, ignorePatterns: string[] = []) {
  return new Map(entries
    .filter(entry => entry.type === "file")
    .map(entry => [relativePath(entry.path, rootPath), entry] as const)
    .filter(([path]) => !isIgnored(path, ignorePatterns)));
}
