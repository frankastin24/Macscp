import type { FileEntry } from "../../shared/FileEntry";
import type { SftpConnectionConfig } from "../../shared/sftp/SftpConnection";
import type { TransferItem } from "../../shared/transfers/TransferItem";
import type { CompareEntry } from "../../shared/compare/CompareEntry";
declare global {
    interface Window {
        macscp: {
            local: {
                listDirectory: (dirPath?: string) => Promise<FileEntry[]>;
            };
            compare: {
                directories: (localPath: string, remotePath: string) => Promise<CompareEntry[]>;
            };
            sftp: {
                testConnection: (config: SftpConnectionConfig) => Promise<boolean>;
                connect: (config: SftpConnectionConfig) => Promise<boolean>;
                listDirectory: (remotePath?: string) => Promise<FileEntry[]>;
                disconnect: () => Promise<void>;
            };
            transfers: {
                enqueue: (item: TransferItem) => Promise<TransferItem>;
                onProgress: (callback: (item: TransferItem) => void) => () => void;
            };
        };
    }
}

export { };