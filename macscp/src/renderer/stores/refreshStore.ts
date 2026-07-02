import { defineStore } from "pinia";

export const useRefreshStore = defineStore("refresh", {
  state: () => ({
    localRefreshToken: 0,
    remoteRefreshToken: 0,
  }),

  actions: {
    refreshLocal() {
      this.localRefreshToken++;
    },

    refreshRemote() {
      this.remoteRefreshToken++;
    },
  },
});