import { Client, SFTPWrapper, type ClientChannel, type FileEntryWithStats as SftpFileEntry } from "ssh2";
import path from "node:path/posix";
import type { SftpConnectionConfig } from "../../shared/sftp/SftpConnection";
import type { FileEntry } from "../../shared/filesystem/FileEntry";
import { runWithConcurrency } from "../../shared/utils/runWithConcurrency";

export class SftpService {
    private client: Client | null = null;
    private sftp: SFTPWrapper | null = null;
    private shell: ClientChannel | null = null;

    async connect(config: SftpConnectionConfig): Promise<boolean> {
        await this.disconnect();

        this.client = new Client();

        await new Promise<void>((resolve, reject) => {
            this.client!
                .on("ready", () => resolve())
                .on("error", reject)
                .connect({
                    host: config.host,
                    port: config.port || 22,
                    username: config.username,
                    password: config.password,
                    privateKey: config.privateKey,
                    readyTimeout: 10000,
                });
        });

        this.sftp = await new Promise<SFTPWrapper>((resolve, reject) => {
            this.client!.sftp((err, sftp) => {
                if (err) reject(err);
                else resolve(sftp);
            });
        });

        return true;
    }

    async disconnect(): Promise<void> {
        this.closeShell();
        if (this.client) {
            this.client.end();
        }

        this.client = null;
        this.sftp = null;
    }

    async startShell(
        onData: (data: string) => void,
        onClose: () => void
    ): Promise<void> {
        if (!this.client) throw new Error("Not connected to SSH server");
        this.closeShell();

        this.shell = await new Promise<ClientChannel>((resolve, reject) => {
            this.client!.shell({ term: "xterm-256color", cols: 120, rows: 30 }, (err, stream) => {
                if (err) reject(err);
                else resolve(stream);
            });
        });

        const shell = this.shell;
        shell.on("data", (data: Buffer) => onData(data.toString("utf8")));
        shell.stderr.on("data", (data: Buffer) => onData(data.toString("utf8")));
        shell.on("close", () => {
            if (this.shell === shell) this.shell = null;
            onClose();
        });
    }

    writeShell(data: string): void {
        if (!this.shell) throw new Error("SSH terminal is not open");
        this.shell.write(data);
    }

    resizeShell(cols: number, rows: number): void {
        if (!this.shell) return;
        this.shell.setWindow(rows, cols, 0, 0);
    }

    closeShell(): void {
        if (!this.shell) return;
        const shell = this.shell;
        this.shell = null;
        shell.end();
    }

    async listDirectory(remotePath = "."): Promise<FileEntry[]> {
        if (!this.sftp) {
            throw new Error("Not connected to SFTP server");
        }

        const entries = await new Promise<SftpFileEntry[]>((resolve, reject) => {
            this.sftp!.readdir(remotePath, (err, list) => {
                if (err) reject(err);
                else resolve(list);
            });
        });

        return entries
            .filter((entry) => entry.filename !== "." && entry.filename !== "..")
            .map((entry): FileEntry => {
                const attrs = entry.attrs;

                return {
                    name: entry.filename,
                    path: path.join(remotePath, entry.filename),
                    type: attrs.isDirectory()
                        ? "directory"
                        : attrs.isSymbolicLink()
                            ? "symlink"
                            : attrs.isFile()
                                ? "file"
                                : "other",
                    size: attrs.size,
                    modifiedAt: attrs.mtime * 1000,
                };
            })
            .sort((a, b) => {
                if (a.type === "directory" && b.type !== "directory") return -1;
                if (a.type !== "directory" && b.type === "directory") return 1;
                return a.name.localeCompare(b.name);
            });
    }
    async uploadFile(
        localPath: string,
        remotePath: string,
        onProgress?: (transferred: number, total: number) => void
    ): Promise<void> {
        if (!this.sftp) {
            throw new Error("Not connected to SFTP server");
        }

        await new Promise<void>((resolve, reject) => {
            this.sftp!.fastPut(
                localPath,
                remotePath,
                {
                    step: (transferred, _chunk, total) => {
                        onProgress?.(transferred, total);
                    },
                },
                err => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async downloadFile(
        remotePath: string,
        localPath: string,
        onProgress?: (transferred: number, total: number) => void
    ): Promise<void> {
        if (!this.sftp) {
            throw new Error("Not connected to SFTP server");
        }

        await new Promise<void>((resolve, reject) => {
            this.sftp!.fastGet(
                remotePath,
                localPath,
                {
                    step: (transferred, _chunk, total) => {
                        onProgress?.(transferred, total);
                    },
                },
                err => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    async mkdir(remotePath: string): Promise<void> {
        if (!this.sftp) {
            throw new Error("Not connected to SFTP server");
        }

        await new Promise<void>(resolve => {
            this.sftp!.mkdir(remotePath, err => {
                if (err) {
                    // ssh2 usually returns code 4 for "failure", including already exists.
                    // We ignore it for now because recursive mkdir will attempt existing folders.
                    resolve();
                    return;
                }

                resolve();
            });
        });
    }

    async mkdirRecursive(remotePath: string): Promise<void> {
        if (!remotePath || remotePath === "." || remotePath === "/") return;

        const absolute = remotePath.startsWith("/");
        const parts = remotePath.split("/").filter(Boolean);

        let current = absolute ? "" : ".";

        for (const part of parts) {
            current = absolute
                ? `${current}/${part}`
                : current === "."
                    ? part
                    : `${current}/${part}`;

            await this.mkdir(current);
        }
    }
    async walkDirectory(remotePath: string): Promise<FileEntry[]> {
        if (!this.sftp) {
            throw new Error("Not connected to SFTP server");
        }

        const results: FileEntry[] = [];

        const walk = async (currentPath: string) => {
            const entries = await this.listDirectory(currentPath);

            for (const entry of entries) {
                results.push(entry);

                if (entry.type === "directory") {
                    await walk(entry.path);
                }
            }
        };

        await walk(remotePath);
        return results;
    }

    async deletePath(remotePath: string, type: FileEntry["type"]): Promise<void> {
        if (!this.sftp) throw new Error("Not connected to SFTP server");

        if (type === "directory") {
            const entries = await this.listDirectory(remotePath);
            await runWithConcurrency(entries, 4, entry => this.deletePath(entry.path, entry.type));
            await new Promise<void>((resolve, reject) => {
                this.sftp!.rmdir(remotePath, err => err ? reject(err) : resolve());
            });
            return;
        }

        await new Promise<void>((resolve, reject) => {
            this.sftp!.unlink(remotePath, err => err ? reject(err) : resolve());
        });
    }

    async readFile(remotePath: string): Promise<string> {
        if (!this.sftp) throw new Error("Not connected to SFTP server");
        return new Promise<string>((resolve, reject) => {
            this.sftp!.readFile(remotePath, (err, data) => {
                if (err) reject(err);
                else resolve(data.toString("utf8"));
            });
        });
    }

    async writeFile(remotePath: string, content: string): Promise<void> {
        if (!this.sftp) throw new Error("Not connected to SFTP server");
        await new Promise<void>((resolve, reject) => {
            this.sftp!.writeFile(remotePath, content, "utf8", err => err ? reject(err) : resolve());
        });
    }
}
