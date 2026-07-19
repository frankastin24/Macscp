import type { WatchConfig } from "../../shared/watch/WatchConfig";
import { WatchSyncService } from "./WatchSyncService";

export class WatchSyncManager {
  private readonly services = new Map<string, WatchSyncService>();

  async start(config: WatchConfig) {
    await this.stop(config.tabId);
    const service = new WatchSyncService();
    this.services.set(config.tabId, service);
    return service.start(config);
  }

  async stop(tabId: string) {
    const service = this.services.get(tabId);
    if (!service) return { watching: false };
    this.services.delete(tabId);
    return service.stop();
  }

  async stopAll() {
    await Promise.all([...this.services.keys()].map(tabId => this.stop(tabId)));
  }
}

export const watchSyncManager = new WatchSyncManager();
