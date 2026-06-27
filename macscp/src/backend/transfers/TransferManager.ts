import { BrowserWindow } from "electron";
import type { TransferItem } from "../../shared/transfers/TransferItem";
import { IPC_CHANNELS } from "../../shared/ipc/IpcChannels";

export class TransferManager {
  private items = new Map<string, TransferItem>();

  enqueue(item: TransferItem): TransferItem {
    this.items.set(item.id, item);
    this.simulate(item.id);
    return item;
  }

  private sendUpdate(item: TransferItem) {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(IPC_CHANNELS.transferProgress, item);
    });
  }

  private simulate(id: string) {
    const item = this.items.get(id);
    if (!item) return;

    item.status = "running";
    this.sendUpdate(item);

    const timer = setInterval(() => {
      const current = this.items.get(id);
      if (!current) {
        clearInterval(timer);
        return;
      }

      current.progress += 10;
      current.bytesTransferred = current.progress;

      if (current.progress >= 100) {
        current.progress = 100;
        current.status = "completed";
        this.sendUpdate(current);
        clearInterval(timer);
        return;
      }

      this.sendUpdate(current);
    }, 300);
  }
}

export const transferManager = new TransferManager();