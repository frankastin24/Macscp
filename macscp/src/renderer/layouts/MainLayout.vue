<template>
  <div class="app">

    <header class="toolbar">
      MacSCP
    </header>
    <ConnectionPanel />
    <SessionPanel @load-session="loadSession" />
    <main class="workspace">

     <section class="pane">
        <LocalExplorer />
      </section>

      <section class="pane">
        <RemoteExplorer />
      </section>

    </main>
    <TransferEventListener />
    <TransferPopup />
    <StatusBar />
    <SessionPathSync />

  </div>
</template>

<script setup lang="ts">
import LocalExplorer from "../components/LocalExplorer.vue";
import ConnectionPanel from "../components/ConnectionPanel.vue";
import RemoteExplorer from "../components/RemoteExplorer.vue";
import TransferQueue from "../components/queue/TransferQueue.vue";
import StatusBar from "../components/StatusBar.vue";
import TransferPopup from "../components/transfers/TransferPopup.vue";
import TransferEventListener from "../components/transfers/TransferEventListener.vue";
import SessionPanel from "../components/sessions/SessionPanel.vue";
import { useSessionStore } from "../stores/sessionStore";
import type { SavedSession } from "../../shared/sessions/Session";
import SessionPathSync from "../components/sessions/SessionPathSync.vue";
const sessionStore = useSessionStore();

function loadSession(session: SavedSession) {
  sessionStore.requestLoadSession(session);
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