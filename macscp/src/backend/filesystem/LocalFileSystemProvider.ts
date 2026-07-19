import fs from "node:fs/promises";
import path from "node:path";
import type { FileEntry } from "../../shared/filesystem/FileEntry";
import type { FileSystemProvider } from "./FileSystemProvider";

export class LocalFileSystemProvider implements FileSystemProvider {
    async listDirectory(dirPath: string): Promise<FileEntry[]> {
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

    async exists(targetPath: string): Promise<boolean> {
        try {
            await fs.access(targetPath);
            return true;
        } catch {
            return false;
        }
    }

    async createDirectory(targetPath: string): Promise<void> {
        await fs.mkdir(targetPath, { recursive: true });
    }

    async delete(targetPath: string): Promise<void> {
        await fs.rm(targetPath, { recursive: true, force: true });
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        await fs.rename(oldPath, newPath);
    }

    async readFile(targetPath: string): Promise<string> {
        return fs.readFile(targetPath, "utf8");
    }

    async writeFile(targetPath: string, content: string): Promise<void> {
        await fs.writeFile(targetPath, content, "utf8");
    }

    async walkDirectory(dirPath: string): Promise<FileEntry[]> {
        const results: FileEntry[] = [];

        async function walk(currentPath: string) {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                const stat = await fs.lstat(fullPath);

                const fileEntry: FileEntry = {
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

                results.push(fileEntry);

                if (entry.isDirectory()) {
                    await walk(fullPath);
                }
            }
        }

        await walk(dirPath);
        return results;
    }
}
