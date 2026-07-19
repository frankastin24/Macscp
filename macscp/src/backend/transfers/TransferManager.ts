import { BrowserWindow } from "electron";
import type { TransferItem } from "../../shared/transfers/TransferItem";
import { IPC_CHANNELS } from "../../shared/ipc/IpcChannels";
import { UploadWorker } from "./workers/UploadWorker";
import { DownloadWorker } from "./workers/DownloadWorker";
import { sftpConnectionRegistry } from "../sftp/SftpConnectionRegistry";

const WORKERS_PER_QUEUE = 4;

export class TransferManager {
  private items = new Map<string, TransferItem>();
  private runningQueues = new Set<string>();

  private uploadWorker = new UploadWorker();
  private downloadWorker = new DownloadWorker();

  enqueue(item: TransferItem): TransferItem {
    this.items.set(item.id, item);
    this.sendUpdate(item);
    void this.processQueue(item.queueId);
    return item;
  }

  private async processQueue(queueId: string) {
    if (this.runningQueues.has(queueId)) return;
    this.runningQueues.add(queueId);

    try {
      await Promise.all(
        Array.from({ length: WORKERS_PER_QUEUE }, () => this.runWorker(queueId))
      );
    } finally {
      this.runningQueues.delete(queueId);
      if (this.nextQueued(queueId)) void this.processQueue(queueId);
    }
  }

  private async runWorker(queueId: string) {
    let next = this.nextQueued(queueId);
    while (next) {
      const sftpService = sftpConnectionRegistry.get(next.tabId);
      if (next.direction === "upload") {
        await this.uploadWorker.run(next, sftpService, item => this.sendUpdate(item));
      } else {
        await this.downloadWorker.run(next, sftpService, item => this.sendUpdate(item));
      }
      next = this.nextQueued(queueId);
    }
  }

  private nextQueued(queueId: string) {
    return [...this.items.values()].find(item => item.queueId === queueId && item.status === "queued");
  }

  hasActive(tabId: string) {
    return [...this.items.values()].some(item =>
      item.tabId === tabId && (item.status === "queued" || item.status === "running")
    );
  }

  cancelForTab(tabId: string) {
    for (const item of this.items.values()) {
      if (item.tabId === tabId && (item.status === "queued" || item.status === "running")) {
        item.status = "cancelled";
        this.sendUpdate(item);
      }
    }
  }

  private sendUpdate(item: TransferItem) {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(IPC_CHANNELS.transferProgress, { ...item });
    });
  }
}

export const transferManager = new TransferManager();
