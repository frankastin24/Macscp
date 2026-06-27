import { Client } from "ssh2";
import type { SftpConnectionConfig } from "../../shared/sftp/SftpConnection";

export class SftpService {
  testConnection(config: SftpConnectionConfig): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const client = new Client();

      client
        .on("ready", () => {
          client.end();
          resolve(true);
        })
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
  }
}

export const sftpService = new SftpService();