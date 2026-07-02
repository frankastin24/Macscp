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
}

export const explorerService = new ExplorerService();