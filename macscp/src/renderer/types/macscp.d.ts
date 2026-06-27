import type { FileEntry } from "../../shared/FileEntry";

declare global {
  interface Window {
    macscp: {
      local: {
        listDirectory: (dirPath?: string) => Promise<FileEntry[]>;
      };
    };
  }
}

export {};