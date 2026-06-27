import { Client, SFTPWrapper } from "ssh2";
import path from "node:path/posix";
import type { SftpConnectionConfig } from "../../shared/sftp/SftpConnection";
import type { FileEntry } from "../../shared/filesystem/FileEntry";

export class SftpService {
  private client: Client | null = null;
  private sftp: SFTPWrapper | null = null;

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

  async testConnection(config: SftpConnectionConfig): Promise<boolean> {
    const temp = new Client();

    await new Promise<void>((resolve, reject) => {
      temp
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

    temp.end();
    return true;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.end();
    }

    this.client = null;
    this.sftp = null;
  }

  async listDirectory(remotePath = "."): Promise<FileEntry[]> {
    if (!this.sftp) {
      throw new Error("Not connected to SFTP server");
    }

    const entries = await new Promise<any[]>((resolve, reject) => {
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
}

export const sftpService = new SftpService();