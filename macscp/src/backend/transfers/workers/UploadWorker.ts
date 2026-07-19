import type { TransferItem } from "../../../shared/transfers/TransferItem";
import type { SftpService } from "../../sftp/SftpService";
import { getRemoteDirectory } from "../utils/pathUtils";

export class UploadWorker {
  async run(
    item: TransferItem,
    sftpService: SftpService,
    onProgress: (item: TransferItem) => void
  ): Promise<TransferItem> {
    item.status = "running";
    item.progress = 1;
    onProgress(item);

    try {
      const remoteDirectory = getRemoteDirectory(item.targetPath);
      await sftpService.mkdirRecursive(remoteDirectory);

      await sftpService.uploadFile(item.sourcePath, item.targetPath, (transferred, total) => {
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
      item.error = err instanceof Error ? err.message : "Upload failed";
      onProgress(item);
      return item;
    }
  }
}
