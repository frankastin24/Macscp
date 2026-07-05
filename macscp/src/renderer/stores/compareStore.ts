import { defineStore } from "pinia";
import type { CompareEntry } from "../../shared/compare/CompareEntry";
let autoCompareTimer: ReturnType<typeof setTimeout> | null = null;
export const useCompareStore = defineStore("compare", {
  state: () => ({
    entries: [] as CompareEntry[],
    visible: false,
    loading: false,
    error: "",
  }),

  actions: {
    async compare(localPath: string, remotePath: string) {
      this.loading = true;
      this.error = "";

      try {
        this.entries = await window.macscp.compare.directories(localPath, remotePath);
        this.visible = true;
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Compare failed";
      } finally {
        this.loading = false;
      }
    },

    close() {
      this.visible = false;
    },
    autoCompare(localPath: string, remotePath: string, remoteConnected: boolean) {
      if (!remoteConnected) return;
      if (!localPath || !remotePath) return;

      if (autoCompareTimer) {
        clearTimeout(autoCompareTimer);
      }

      autoCompareTimer = setTimeout(() => {
        this.compare(localPath, remotePath);
      }, 500);
    }
  },
});