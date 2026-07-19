import type { FileEntry } from "../../shared/filesystem/FileEntry";

export function deleteConfirmation(entries: FileEntry[], side: "local" | "remote") {
  if (entries.length === 1) {
    const recursive = entries[0].type === "directory" ? " and everything inside it" : "";
    return `Delete ${entries[0].name}${recursive} from the ${side} filesystem?`;
  }
  return `Delete ${entries.length} selected items from the ${side} filesystem? Directories will be deleted recursively.`;
}
