// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import type { FileEntry } from "./shared/FileEntry";

contextBridge.exposeInMainWorld("macscp", {
  local: {
    listDirectory: (dirPath?: string): Promise<FileEntry[]> =>
      ipcRenderer.invoke("local:listDirectory", dirPath),
  },
});