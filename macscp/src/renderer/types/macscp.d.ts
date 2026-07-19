import type { FileEntry } from "../../shared/filesystem/FileEntry";
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
                delete: (targetPath: string) => Promise<void>;
            };
            compare: {
                directories: (tabId: string, localPath: string, remotePath: string) => Promise<CompareEntry[]>;
            };
            sftp: {
                connect: (tabId: string, config: SftpConnectionConfig) => Promise<boolean>;
                disconnect: (tabId: string) => Promise<void>;
                listDirectory: (tabId: string, remotePath?: string) => Promise<FileEntry[]>;
                walkDirectory: (tabId: string, remotePath: string) => Promise<FileEntry[]>;
                delete: (tabId: string, remotePath: string, type: FileEntry["type"]) => Promise<void>;
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
                stop: (tabId: string) => Promise<{ watching: boolean }>;
            };
            tabs: {
                dispose: (tabId: string) => Promise<void>;
            };
            terminal: {
                start: (tabId: string) => Promise<void>;
                write: (tabId: string, data: string) => Promise<void>;
                resize: (tabId: string, cols: number, rows: number) => Promise<void>;
                close: (tabId: string) => Promise<void>;
                onData: (callback: (payload: { tabId: string; data: string }) => void) => () => void;
                onClosed: (callback: (payload: { tabId: string }) => void) => () => void;
            };
            files: {
                readLocal: (path: string) => Promise<string>;
                writeLocal: (path: string, content: string) => Promise<void>;
                readRemote: (tabId: string, path: string) => Promise<string>;
                writeRemote: (tabId: string, path: string, content: string) => Promise<void>;
            };
        };
    }
}

export { };
