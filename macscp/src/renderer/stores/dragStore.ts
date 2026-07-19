import { defineStore } from "pinia";
import type { FileEntry } from "../../shared/filesystem/FileEntry";

export type DragSource = "local" | "remote";

export const useDragStore = defineStore("drag", {
  state: () => ({
    source: null as DragSource | null,
    tabId: null as string | null,
    entries: [] as FileEntry[],
  }),

  actions: {
    start(tabId: string, source: DragSource, entries: FileEntry[]) {
      this.tabId = tabId;
      this.source = source;
      this.entries = entries;
    },

    clear() {
      this.source = null;
      this.tabId = null;
      this.entries = [];
    },
  },
});
