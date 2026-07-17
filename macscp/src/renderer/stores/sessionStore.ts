import { defineStore } from "pinia";
import type { SavedSession } from "../../shared/sessions/Session";

export const useSessionStore = defineStore("sessions", {
  state: () => ({
    sessions: [] as SavedSession[],
    selectedSession: null as SavedSession | null,
    requestSaveCurrentToken: 0,
    pendingLoadSession: null as SavedSession | null,
    activeSessionId: null as string | null,
  }),

  actions: {
    async load() {
      this.sessions = await window.macscp.sessions.list();
      console.log("Loaded sessions:", this.sessions);
    },

    select(session: SavedSession) {
      this.selectedSession = session;
    },

    async save(session: SavedSession, password?: string) {
      await window.macscp.sessions.save(session, password);
      await this.load();
    },

    async delete(id: string) {
      await window.macscp.sessions.delete(id);
      await this.load();
    },
    requestSaveCurrent() {
      this.requestSaveCurrentToken++;
    },

    requestLoadSession(session: SavedSession) {
      this.pendingLoadSession = session;
    },

    clearPendingLoadSession() {
      this.pendingLoadSession = null;
    },
    setActiveSession(sessionId: string | null) {
      this.activeSessionId = sessionId;
    },

    async updateActiveSessionPaths(localPath: string, remotePath: string) {
      if (!this.activeSessionId) return;

      const session = this.sessions.find(item => item.id === this.activeSessionId);
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