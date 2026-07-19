import { defineStore } from "pinia";
import type { SavedSession } from "../../shared/sessions/Session";
import type { SessionTab } from "../../shared/tabs/Tab";
import { useEditorStore } from "./editorStore";

function blankTab(source?: Partial<SessionTab>): SessionTab {
  const tabId = crypto.randomUUID();
  return {
    tabId,
    title: "New Session",
    sessionId: null,
    connection: { host: "", port: 22, username: "", password: "", state: "disconnected", error: "" },
    localPath: "Home",
    remotePath: ".",
    ignorePatterns: [".git/", "node_modules/", ".DS_Store", ".Trash/"],
    localSelection: [],
    remoteSelection: [],
    compareEntries: [],
    compareVisible: false,
    transferQueueId: tabId,
    watching: false,
    watchStartedAt: null,
    transferPopupVisible: false,
    createdAt: Date.now(),
    ...source,
  };
}

export const useTabStore = defineStore("tabs", {
  state: () => ({
    orderedTabIds: [] as string[],
    tabsById: {} as Record<string, SessionTab>,
    activeTabId: "",
  }),
  getters: {
    activeTab(state): SessionTab | undefined {
      return state.tabsById[state.activeTabId];
    },
    tabs(state): SessionTab[] {
      return state.orderedTabIds.map(id => state.tabsById[id]).filter(Boolean);
    },
  },
  actions: {
    ensureTab() {
      if (!this.orderedTabIds.length) this.openBlank();
    },
    openBlank() {
      const tab = blankTab();
      this.tabsById[tab.tabId] = tab;
      this.orderedTabIds.push(tab.tabId);
      this.activeTabId = tab.tabId;
      return tab;
    },
    async openSession(session: SavedSession) {
      const password = await window.macscp.sessions.getDecryptedPassword(session.id);
      const tab = blankTab({
        title: session.name,
        sessionId: session.id,
        connection: {
          host: session.host,
          port: session.port,
          username: session.username,
          password,
          state: "disconnected",
          error: "",
        },
        localPath: session.localPath,
        remotePath: session.remotePath,
        ignorePatterns: session.ignorePatterns || [".git/", "node_modules/", ".DS_Store", ".Trash/"],
      });
      this.tabsById[tab.tabId] = tab;
      this.orderedTabIds.push(tab.tabId);
      this.activeTabId = tab.tabId;
      return tab;
    },
    duplicate(tabId: string) {
      const source = this.tabsById[tabId];
      if (!source) return;
      const tab = blankTab({
        title: `${source.title} Copy`,
        sessionId: source.sessionId,
        connection: { ...source.connection, state: "disconnected", error: "" },
        localPath: source.localPath,
        remotePath: source.remotePath,
        ignorePatterns: [...source.ignorePatterns],
      });
      this.tabsById[tab.tabId] = tab;
      const index = this.orderedTabIds.indexOf(tabId);
      this.orderedTabIds.splice(index + 1, 0, tab.tabId);
      this.activeTabId = tab.tabId;
    },
    select(tabId: string) {
      if (this.tabsById[tabId]) this.activeTabId = tabId;
    },
    move(tabId: string, targetIndex: number) {
      const from = this.orderedTabIds.indexOf(tabId);
      if (from < 0) return;
      this.orderedTabIds.splice(from, 1);
      this.orderedTabIds.splice(Math.max(0, Math.min(targetIndex, this.orderedTabIds.length)), 0, tabId);
    },
    async close(tabId: string) {
      const index = this.orderedTabIds.indexOf(tabId);
      if (index < 0) return;
      await window.macscp.tabs.dispose(tabId);
      delete useEditorStore().documents[tabId];
      this.orderedTabIds.splice(index, 1);
      delete this.tabsById[tabId];
      if (this.activeTabId === tabId) {
        this.activeTabId = this.orderedTabIds[Math.min(index, this.orderedTabIds.length - 1)] || "";
      }
      this.ensureTab();
    },
  },
});
