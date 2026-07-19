import fs from "node:fs/promises";
import type { TransferItem } from "../../../shared/transfers/TransferItem";
import type { SftpService } from "../../sftp/SftpService";
import { getLocalDirectory } from "../utils/pathUtils";

export class DownloadWorker {
  async run(
    item: TransferItem,
    sftpService: SftpService,
    onProgress: (item: TransferItem) => void
  ): Promise<TransferItem> {
    item.status = "running";
    item.progress = 1;
    onProgress(item);

    try {
      const localDirectory = getLocalDirectory(item.targetPath);
      await fs.mkdir(localDirectory, { recursive: true });

      await sftpService.downloadFile(item.sourcePath, item.targetPath, (transferred, total) => {
        item.bytesTransferred = transferred;
        item.totalBytes = total || item.totalBytes;
        item.progress = item.totalBytes
          ? Math.round((transferred / item.totalBytes) * 100)
          : 0;

        onProgress(item);
      });

      item.progress = 100;
      item.status = "completed";
      onProgress(item);

      return item;
    } catch (err) {
      if ((item as TransferItem).status === "cancelled") return item;
      item.status = "failed";
      item.error = err instanceof Error ? err.message : "Download failed";
      onProgress(item);
      return item;
    }
  }
}
