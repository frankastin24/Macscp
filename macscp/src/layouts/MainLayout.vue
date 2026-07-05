<template>
  <div class="app">

    <header class="toolbar">
      MacSCP
    </header>
    <ConnectionPanel />
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

  </div>
</template>

<script setup lang="ts">
import LocalExplorer from "../renderer/components/LocalExplorer.vue";
import ConnectionPanel from "../renderer/components/ConnectionPanel.vue";
import RemoteExplorer from "../renderer/components/RemoteExplorer.vue";
import TransferQueue from "../renderer/components/queue/TransferQueue.vue";
import StatusBar from "../renderer/components/StatusBar.vue";
import TransferPopup from "../renderer/components/transfers/TransferPopup.vue";
import TransferEventListener from "../renderer/components/transfers/TransferEventListener.vue";
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