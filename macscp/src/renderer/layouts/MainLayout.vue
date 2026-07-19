<template>
  <div class="app">

    <header class="toolbar">
      MacSCP
    </header>
    <TabBar />
    <div class="main-area">
      <SessionPanel @load-session="loadSession" />
      <div class="workspaces">
        <SessionWorkspace
          v-for="tab in tabStore.tabs"
          v-show="tab.tabId === tabStore.activeTabId"
          :key="tab.tabId"
          :tab-id="tab.tabId"
        />
      </div>
    </div>
    <TransferEventListener />

  </div>
</template>

<script setup lang="ts">
import TransferEventListener from "../components/transfers/TransferEventListener.vue";
import SessionPanel from "../components/sessions/SessionPanel.vue";
import type { SavedSession } from "../../shared/sessions/Session";
import TabBar from "../components/tabs/TabBar.vue";
import SessionWorkspace from "../components/tabs/SessionWorkspace.vue";
import { useTabStore } from "../stores/tabStore";
const tabStore = useTabStore();
tabStore.ensureTab();

function loadSession(session: SavedSession) {
  void tabStore.openSession(session);
}
</script>

<style scoped>

.app{
    height:100vh;
    display:flex;
    flex-direction:column;
}

.toolbar{
    height:42px;
    background:#2f2f2f;
    display:flex;
    align-items:center;
    padding:0 15px;
    color:white;
}
.main-area {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}
.workspaces {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
}
.workspace {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.pane {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid #444;
}

.statusbar{
    height:28px;
    background:#222;
    display:flex;
    align-items:center;
    padding-left:15px;
    color:#aaa;
}

</style>
