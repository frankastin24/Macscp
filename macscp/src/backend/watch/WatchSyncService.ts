import { watch, type FSWatcher } from "chokidar";
import path from "node:path";
import { transferManager } from "../transfers/TransferManager";
import type { WatchConfig } from "../../shared/watch/WatchConfig";
import type { TransferItem } from "../../shared/transfers/TransferItem";
import { isIgnored } from "../../shared/utils/ignorePatterns";

export class WatchSyncService {
  private watcher: FSWatcher | null = null;
  private config: WatchConfig | null = null;
  private timers = new Map<string, NodeJS.Timeout>();

  async start(config: WatchConfig) {
  await this.stop();
  this.config = config;

  this.watcher = watch(config.localPath, {
    ignored: candidatePath => isIgnored(path.relative(config.localPath, candidatePath), config.ignorePatterns),
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 800,
      pollInterval: 100,
    },
  });

  this.watcher.on("add", filePath => this.queueUpload(filePath));
  this.watcher.on("change", filePath => this.queueUpload(filePath));

  this.watcher.on("error", err => {
    console.error("Watch sync error:", err);
  });

  return { watching: true };
}

  async stop() {
  for (const timer of this.timers.values()) {
    clearTimeout(timer);
  }

  this.timers.clear();

  if (this.watcher) {
    const watcher = this.watcher;
    this.watcher = null;

    try {
      await watcher.close();
    } catch (err) {
      console.error("Failed to close watcher:", err);
    }
  }

  this.config = null;

  return { watching: false };
}

  private queueUpload(filePath: string) {
    if (!this.config) return;

    const existing = this.timers.get(filePath);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.timers.delete(filePath);
      this.enqueueUpload(filePath);
    }, 300);

    this.timers.set(filePath, timer);
  }

  private enqueueUpload(filePath: string) {
    if (!this.config) return;

    const relativePath = path.relative(this.config.localPath, filePath);
    const remoteTarget = this.joinRemote(this.config.remotePath, relativePath);

    const item: TransferItem = {
      id: crypto.randomUUID(),
      tabId: this.config.tabId,
      queueId: this.config.queueId,
      direction: "upload",
      sourcePath: filePath,
      targetPath: remoteTarget,
      filename: path.basename(filePath),
      status: "queued",
      progress: 0,
      bytesTransferred: 0,
      totalBytes: 0,
      createdAt: Date.now(),
    };

    transferManager.enqueue(item);
  }

  private joinRemote(base: string, relativePath: string) {
    const cleanBase = base === "." ? "" : base.replace(/\/$/, "");
    const cleanRelative = relativePath.split(path.sep).join("/");

    if (!cleanBase) return cleanRelative;
    if (cleanBase === "/") return `/${cleanRelative}`;

    return `${cleanBase}/${cleanRelative}`;
  }
}
