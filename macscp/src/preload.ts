// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import type { FileEntry } from "./shared/filesystem/FileEntry";
import type { SftpConnectionConfig } from "./shared/sftp/SftpConnection";
import type { TransferItem } from "./shared/transfers/TransferItem";
import { IPC_CHANNELS } from "./shared/ipc/IpcChannels";
contextBridge.exposeInMainWorld("macscp", {
    local: {
        listDirectory: (dirPath?: string): Promise<FileEntry[]> =>
            ipcRenderer.invoke("local:listDirectory", dirPath),
    },
    sftp: {
        testConnection: (config: SftpConnectionConfig): Promise<boolean> =>
            ipcRenderer.invoke("sftp:testConnection", config),
        connect: (config: SftpConnectionConfig): Promise<boolean> =>
            ipcRenderer.invoke("sftp:connect", config),

        listDirectory: (remotePath?: string): Promise<FileEntry[]> =>
            ipcRenderer.invoke("sftp:listDirectory", remotePath),

        disconnect: (): Promise<void> =>
            ipcRenderer.invoke("sftp:disconnect"),
    },
    transfers: {
        enqueue: (item: TransferItem): Promise<TransferItem> =>
            ipcRenderer.invoke(IPC_CHANNELS.transferEnqueue, item),

        onProgress: (callback: (item: TransferItem) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, item: TransferItem) => {
                callback(item);
            };

            ipcRenderer.on(IPC_CHANNELS.transferProgress, listener);

            return () => {
                ipcRenderer.removeListener(IPC_CHANNELS.transferProgress, listener);
            };
        },
    },
});