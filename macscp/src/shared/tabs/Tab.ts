import type { CompareEntry } from "../compare/CompareEntry";
import type { FileEntry } from "../filesystem/FileEntry";
import type { SftpConnectionConfig } from "../sftp/SftpConnection";

export type TabId = string;
export type TransferQueueId = string;
export type ConnectionState = "disconnected" | "connecting" | "connected" | "disconnecting" | "error";

export interface SessionTab {
  tabId: TabId;
  title: string;
  sessionId: string | null;
  connection: SftpConnectionConfig & { state: ConnectionState; error: string };
  localPath: string;
  remotePath: string;
  ignorePatterns: string[];
  localSelection: FileEntry[];
  remoteSelection: FileEntry[];
  compareEntries: CompareEntry[];
  compareVisible: boolean;
  transferQueueId: TransferQueueId;
  watching: boolean;
  watchStartedAt: number | null;
  transferPopupVisible: boolean;
  createdAt: number;
}
