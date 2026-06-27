import type { FileEntry } from "../../shared/FileEntry";
import type { SftpConnectionConfig } from "../../shared/sftp/SftpConnection";  
import type { TransferItem } from "../../shared/transfers/TransferItem"; 
declare global {
  interface Window {
    macscp: {
      local: {
        listDirectory: (dirPath?: string) => Promise<FileEntry[]>;
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

export {};