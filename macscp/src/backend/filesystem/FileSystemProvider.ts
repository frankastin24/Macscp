import type { FileEntry } from "../../shared/filesystem/FileEntry";

export interface FileSystemProvider {
  listDirectory(path: string): Promise<FileEntry[]>;

  exists(path: string): Promise<boolean>;

  createDirectory(path: string): Promise<void>;

  delete(path: string): Promise<void>;

  rename(oldPath: string, newPath: string): Promise<void>;
}