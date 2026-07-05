import { defineStore } from "pinia";
import type { FileEntry } from "../../shared/filesystem/FileEntry";

export type DragSource = "local" | "remote";

export const useDragStore = defineStore("drag", {
  state: () => ({
    source: null as DragSource | null,
    entries: [] as FileEntry[],
  }),

  actions: {
    start(source: DragSource, entries: FileEntry[]) {
      this.source = source;
      this.entries = entries;
    },

    clear() {
      this.source = null;
      this.entries = [];
    },
  },
});