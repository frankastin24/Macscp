export type FileEntryType = "file" | "directory" | "symlink" | "other";

export interface FileEntry {
  name: string;
  path: string;
  type: FileEntryType;
  size: number;
  modifiedAt: number;
}