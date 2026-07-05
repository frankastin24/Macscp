import { BrowserWindow } from "electron";
import type { TransferItem } from "../../shared/transfers/TransferItem";
import { IPC_CHANNELS } from "../../shared/ipc/IpcChannels";
import { UploadWorker } from "./workers/UploadWorker";
import { DownloadWorker } from "./workers/DownloadWorker";

export class TransferManager {
  private items = new Map<string, TransferItem>();
  private running = false;

  private uploadWorker = new UploadWorker();
  private downloadWorker = new DownloadWorker();

  enqueue(item: TransferItem): TransferItem {
    this.items.set(item.id, item);
    this.sendUpdate(item);
    void this.processQueue();
    return item;
  }

  private async processQueue() {
    if (this.running) return;

    this.running = true;

    while (true) {
      const next = [...this.items.values()].find(item => item.status === "queued");

      if (!next) break;

      if (next.direction === "upload") {
        await this.uploadWorker.run(next, item => this.sendUpdate(item));
      } else {
        await this.downloadWorker.run(next, item => this.sendUpdate(item));
      }
    }

    this.running = false;
  }

  private sendUpdate(item: TransferItem) {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(IPC_CHANNELS.transferProgress, { ...item });
    });
  }
}

export const transferManager = new TransferManager();