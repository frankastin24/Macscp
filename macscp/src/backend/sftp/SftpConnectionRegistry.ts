import type { SftpConnectionConfig } from "../../shared/sftp/SftpConnection";
import { SftpService } from "./SftpService";

export class SftpConnectionRegistry {
  private readonly services = new Map<string, SftpService>();

  async connect(tabId: string, config: SftpConnectionConfig) {
    await this.disconnect(tabId);
    const service = new SftpService();
    await service.connect(config);
    this.services.set(tabId, service);
    return true;
  }

  get(tabId: string) {
    const service = this.services.get(tabId);
    if (!service) throw new Error(`Tab ${tabId} is not connected`);
    return service;
  }

  async disconnect(tabId: string) {
    const service = this.services.get(tabId);
    if (!service) return;
    this.services.delete(tabId);
    await service.disconnect();
  }

  async disconnectAll() {
    await Promise.all([...this.services.keys()].map(tabId => this.disconnect(tabId)));
  }
}

export const sftpConnectionRegistry = new SftpConnectionRegistry();
