// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import type { FileEntry } from "./shared/filesystem/FileEntry";
import type { SftpConnectionConfig } from "./shared/sftp/SftpConnection";
import type { TransferItem } from "./shared/transfers/TransferItem";
import { IPC_CHANNELS } from "./shared/ipc/IpcChannels";
import type { CompareEntry } from "./shared/compare/CompareEntry";
import type { SavedSession } from "./shared/sessions/Session";
import type { WatchConfig } from "./shared/watch/WatchConfig";
contextBridge.exposeInMainWorld("macscp", {
    local: {
        listDirectory: (dirPath?: string): Promise<FileEntry[]> =>
            ipcRenderer.invoke("local:listDirectory", dirPath),
        walkDirectory: (dirPath: string): Promise<FileEntry[]> =>
            ipcRenderer.invoke(IPC_CHANNELS.walkLocalDirectory, dirPath),
        delete: (targetPath: string): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.localDelete, targetPath),
    },
    sftp: {
        connect: (tabId: string, config: SftpConnectionConfig): Promise<boolean> =>
            ipcRenderer.invoke(IPC_CHANNELS.sftpConnect, { tabId, config }),
        disconnect: (tabId: string): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.sftpDisconnect, tabId),

        listDirectory: (tabId: string, remotePath?: string): Promise<FileEntry[]> =>
            ipcRenderer.invoke(IPC_CHANNELS.sftpListDirectory, { tabId, remotePath }),

        walkDirectory: (tabId: string, remotePath: string): Promise<FileEntry[]> =>
            ipcRenderer.invoke(IPC_CHANNELS.walkRemoteDirectory, { tabId, remotePath }),
        delete: (tabId: string, remotePath: string, type: FileEntry["type"]): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.sftpDelete, { tabId, remotePath, type }),
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
    compare: {
        directories: (tabId: string, localPath: string, remotePath: string): Promise<CompareEntry[]> =>
            ipcRenderer.invoke(IPC_CHANNELS.compareDirectories, { tabId, localPath, remotePath }),
    },
    sessions: {
        list: (): Promise<SavedSession[]> =>
            ipcRenderer.invoke(IPC_CHANNELS.sessionList),

        save: (session: SavedSession, password?: string): Promise<SavedSession> =>
            ipcRenderer.invoke(IPC_CHANNELS.sessionSave, session, password),
        getDecryptedPassword: (sessionId: string): Promise<string> =>
            ipcRenderer.invoke("session:getDecryptedPassword", sessionId),

        delete: (id: string): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.sessionDelete, id),

    },
    watch: {
        start: (config: WatchConfig) =>
            ipcRenderer.invoke(IPC_CHANNELS.watchStart, config),

        stop: (tabId: string) =>
            ipcRenderer.invoke(IPC_CHANNELS.watchStop, tabId),
    },
    tabs: {
        dispose: (tabId: string): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.tabDispose, tabId),
    },
    terminal: {
        start: (tabId: string): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.terminalStart, tabId),
        write: (tabId: string, data: string): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.terminalWrite, { tabId, data }),
        resize: (tabId: string, cols: number, rows: number): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.terminalResize, { tabId, cols, rows }),
        close: (tabId: string): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.terminalClose, tabId),
        onData: (callback: (payload: { tabId: string; data: string }) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, payload: { tabId: string; data: string }) => callback(payload);
            ipcRenderer.on(IPC_CHANNELS.terminalData, listener);
            return () => ipcRenderer.removeListener(IPC_CHANNELS.terminalData, listener);
        },
        onClosed: (callback: (payload: { tabId: string }) => void) => {
            const listener = (_event: Electron.IpcRendererEvent, payload: { tabId: string }) => callback(payload);
            ipcRenderer.on(IPC_CHANNELS.terminalClosed, listener);
            return () => ipcRenderer.removeListener(IPC_CHANNELS.terminalClosed, listener);
        },
    },
    files: {
        readLocal: (path: string): Promise<string> =>
            ipcRenderer.invoke(IPC_CHANNELS.fileReadLocal, path),
        writeLocal: (path: string, content: string): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.fileWriteLocal, { path, content }),
        readRemote: (tabId: string, path: string): Promise<string> =>
            ipcRenderer.invoke(IPC_CHANNELS.fileReadRemote, { tabId, path }),
        writeRemote: (tabId: string, path: string, content: string): Promise<void> =>
            ipcRenderer.invoke(IPC_CHANNELS.fileWriteRemote, { tabId, path, content }),
    },

});
