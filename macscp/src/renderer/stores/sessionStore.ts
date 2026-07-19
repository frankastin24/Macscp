import { defineStore } from "pinia";
import type { SavedSession } from "../../shared/sessions/Session";

export const useSessionStore = defineStore("sessions", {
  state: () => ({
    sessions: [] as SavedSession[],
  }),

  actions: {
    async load() {
      this.sessions = await window.macscp.sessions.list();
      console.log("Loaded sessions:", this.sessions);
    },

    async save(session: SavedSession, password?: string) {
      await window.macscp.sessions.save(session, password);
      await this.load();
    },

    async delete(id: string) {
      await window.macscp.sessions.delete(id);
      await this.load();
    },
    async updateSessionPaths(sessionId: string, localPath: string, remotePath: string) {
      const session = this.sessions.find((item: SavedSession) => item.id === sessionId);
      if (!session) return;

      await window.macscp.sessions.save({
        ...session,
        localPath,
        remotePath,
        updatedAt: Date.now(),
      });

      await this.load();
    },
  },
});
