import os from "node:os";
import type { FileEntry } from "../../shared/filesystem/FileEntry";
import type { FileSystemProvider } from "./FileSystemProvider";
import { LocalFileSystemProvider } from "./LocalFileSystemProvider";

export class ExplorerService {
    private readonly localProvider: FileSystemProvider;

    constructor() {
        this.localProvider = new LocalFileSystemProvider();
    }

    getHomeDirectory(): string {
        return os.homedir();
    }

    async listLocalDirectory(dirPath?: string): Promise<FileEntry[]> {
        return this.localProvider.listDirectory(dirPath || this.getHomeDirectory());
    }

    async walkLocalDirectory(dirPath: string): Promise<FileEntry[]> {
        const provider = this.localProvider as LocalFileSystemProvider;
        return provider.walkDirectory(dirPath);
    }

    async deleteLocalPath(targetPath: string): Promise<void> {
        return this.localProvider.delete(targetPath);
    }

    async readLocalFile(targetPath: string): Promise<string> {
        return this.localProvider.readFile(targetPath);
    }

    async writeLocalFile(targetPath: string, content: string): Promise<void> {
        return this.localProvider.writeFile(targetPath, content);
    }
}

export const explorerService = new ExplorerService();
