import { defineStore } from "pinia";
import type { FileEntry } from "../../shared/filesystem/FileEntry";

export const useExplorerStore = defineStore("explorer", {
  state: () => ({
    localPath: "Home",
    remotePath: ".",
    localSelection: [] as FileEntry[],
    remoteSelection: [] as FileEntry[],
    remoteConnected: false,
  }),

  actions: {
    setLocalPath(path: string) {
      this.localPath = path;
    },

    setRemotePath(path: string) {
      this.remotePath = path;
    },

    setLocalSelection(entries: FileEntry[]) {
      this.localSelection = entries;
    },

    setRemoteSelection(entries: FileEntry[]) {
      this.remoteSelection = entries;
    },

    setRemoteConnected(value: boolean) {
      this.remoteConnected = value;
    },
  },
});