// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import type { FileEntry } from "./shared/filesystem/FileEntry";
import type { SftpConnectionConfig } from "./shared/sftp/SftpConnection";
contextBridge.exposeInMainWorld("macscp", {
  local: {
    listDirectory: (dirPath?: string): Promise<FileEntry[]> =>
      ipcRenderer.invoke("local:listDirectory", dirPath),
  },
  sftp: {
    testConnection: (config: SftpConnectionConfig): Promise<boolean> =>
      ipcRenderer.invoke("sftp:testConnection", config),
  },
});