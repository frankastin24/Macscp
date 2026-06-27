import fs from "node:fs/promises";
import path from "node:path";
import type { FileEntry } from "../../shared/FileEntry";

export async function listLocalDirectory(dirPath: string): Promise<FileEntry[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  const results = await Promise.all(
    entries.map(async (entry): Promise<FileEntry> => {
      const fullPath = path.join(dirPath, entry.name);
      const stat = await fs.lstat(fullPath);

      return {
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory()
          ? "directory"
          : entry.isSymbolicLink()
            ? "symlink"
            : entry.isFile()
              ? "file"
              : "other",
        size: stat.size,
        modifiedAt: stat.mtimeMs,
      };
    })
  );

  return results.sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name);
  });
}