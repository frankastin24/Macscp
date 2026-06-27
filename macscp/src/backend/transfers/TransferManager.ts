import { BrowserWindow } from "electron";
import type { TransferItem } from "../../shared/transfers/TransferItem";
import { IPC_CHANNELS } from "../../shared/ipc/IpcChannels";
import { sftpService } from "../sftp/SftpService";

export class TransferManager {
  private items = new Map<string, TransferItem>();
  private running = false;

  enqueue(item: TransferItem): TransferItem {
    this.items.set(item.id, item);
    this.sendUpdate(item);
    this.processQueue();
    return item;
  }

  private async processQueue() {
    if (this.running) return;

    this.running = true;

    while (true) {
      const next = [...this.items.values()].find(item => item.status === "queued");

      if (!next) break;

      await this.runTransfer(next);
    }

    this.running = false;
  }

  private async runTransfer(item: TransferItem) {
    item.status = "running";
    item.progress = 5;
    this.sendUpdate(item);

    try {
      if (item.direction === "upload") {
        await sftpService.uploadFile(item.sourcePath, item.targetPath);
      } else {
        await sftpService.downloadFile(item.sourcePath, item.targetPath);
      }

      item.progress = 100;
      item.status = "completed";
      this.sendUpdate(item);
    } catch (err) {
      item.status = "failed";
      item.error = err instanceof Error ? err.message : "Transfer failed";
      this.sendUpdate(item);
    }
  }

  private sendUpdate(item: TransferItem) {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(IPC_CHANNELS.transferProgress, item);
    });
  }
}

export const transferManager = new TransferManager();