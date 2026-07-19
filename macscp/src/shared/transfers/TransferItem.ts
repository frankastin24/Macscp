export type TransferDirection = "upload" | "download";
export type TransferStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface TransferItem {
  id: string;
  tabId: string;
  queueId: string;
  direction: TransferDirection;
  sourcePath: string;
  targetPath: string;
  filename: string;
  status: TransferStatus;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  error?: string;
  createdAt: number;
}
