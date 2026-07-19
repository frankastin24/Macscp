import { defineStore } from "pinia";
import type { FileEntry } from "../../shared/filesystem/FileEntry";

export type EditorSide = "local" | "remote";

export interface EditorDocument {
  side: EditorSide;
  path: string;
  name: string;
  content: string;
  savedContent: string;
  loading: boolean;
  saving: boolean;
  error: string;
}

export const useEditorStore = defineStore("editors", {
  state: () => ({
    documents: {} as Record<string, EditorDocument | undefined>,
  }),
  actions: {
    async open(tabId: string, side: EditorSide, entry: FileEntry) {
      const current = this.documents[tabId];
      if (current && current.content !== current.savedContent &&
          !window.confirm("Discard unsaved changes and open another file?")) return;

      const document: EditorDocument = {
        side,
        path: entry.path,
        name: entry.name,
        content: "",
        savedContent: "",
        loading: true,
        saving: false,
        error: "",
      };
      this.documents[tabId] = document;
      try {
        const content = side === "local"
          ? await window.macscp.files.readLocal(entry.path)
          : await window.macscp.files.readRemote(tabId, entry.path);
        if (content.includes("\u0000")) throw new Error("Binary files cannot be opened in the code editor");
        document.content = content;
        document.savedContent = content;
      } catch (error) {
        document.error = error instanceof Error ? error.message : "Failed to read file";
      } finally {
        document.loading = false;
      }
    },
    async save(tabId: string) {
      const document = this.documents[tabId];
      if (!document) return;
      document.saving = true;
      document.error = "";
      try {
        if (document.side === "local") {
          await window.macscp.files.writeLocal(document.path, document.content);
        } else {
          await window.macscp.files.writeRemote(tabId, document.path, document.content);
        }
        document.savedContent = document.content;
      } catch (error) {
        document.error = error instanceof Error ? error.message : "Failed to save file";
      } finally {
        document.saving = false;
      }
    },
    close(tabId: string) {
      const document = this.documents[tabId];
      if (document && document.content !== document.savedContent &&
          !window.confirm("Close this file and discard unsaved changes?")) return;
      delete this.documents[tabId];
    },
  },
});
