import type { FileEntry } from "../../shared/FileEntry";
import type { SftpConnectionConfig } from "../../shared/sftp/SftpConnection";
import type { TransferItem } from "../../shared/transfers/TransferItem";
import type { CompareEntry } from "../../shared/compare/CompareEntry";
import type { SavedSession } from "../../shared/sessions/Session";
import type { WatchConfig } from "../../shared/watch/WatchConfig";
declare global {
    interface Window {
        macscp: {
            local: {
                listDirectory: (dirPath?: string) => Promise<FileEntry[]>;
                walkDirectory: (dirPath: string) => Promise<FileEntry[]>;
            };
            compare: {
                directories: (localPath: string, remotePath: string) => Promise<CompareEntry[]>;
            };
            sftp: {
                testConnection: (config: SftpConnectionConfig) => Promise<boolean>;
                connect: (config: SftpConnectionConfig) => Promise<boolean>;
                listDirectory: (remotePath?: string) => Promise<FileEntry[]>;
                disconnect: () => Promise<void>;
                walkDirectory: (remotePath: string) => Promise<FileEntry[]>;
            };
            transfers: {
                enqueue: (item: TransferItem) => Promise<TransferItem>;
                onProgress: (callback: (item: TransferItem) => void) => () => void;
            };
            sessions: {
                list: () => Promise<SavedSession[]>;
                delete: (id: string) => Promise<void>;
                save: (session: SavedSession, password?: string) => Promise<SavedSession>;
                getDecryptedPassword: (sessionId: string) => Promise<string>;
            };
            watch: {
                start: (config: WatchConfig) => Promise<{ watching: boolean }>;
                stop: () => Promise<{ watching: boolean }>;
                status: () => Promise<{ watching: boolean; config: WatchConfig | null }>;
            };
        };
    }
}

export { };