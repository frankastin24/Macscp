import { defineStore } from "pinia";

export const useRefreshStore = defineStore("refresh", {
  state: () => ({
    localRefreshTokens: {} as Record<string, number>,
    remoteRefreshTokens: {} as Record<string, number>,
  }),

  actions: {
    refreshLocal(tabId: string) {
      this.localRefreshTokens[tabId] = (this.localRefreshTokens[tabId] || 0) + 1;
    },

    refreshRemote(tabId: string) {
      this.remoteRefreshTokens[tabId] = (this.remoteRefreshTokens[tabId] || 0) + 1;
    },
  },
});
