import type { FileEntry } from "../filesystem/FileEntry";

export type CompareStatus =
  | "identical"
  | "local-only"
  | "remote-only"
  | "local-newer"
  | "remote-newer"
  | "different";

export interface CompareEntry {
  name: string;
  status: CompareStatus;
  local?: FileEntry;
  remote?: FileEntry;
}