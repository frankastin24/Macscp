<template>
  <div class="app">

    <header class="toolbar">
      MacSCP
    </header>
    <ConnectionPanel />
    <main class="workspace">

      <LocalExplorer />

      <RemoteExplorer />

    </main>

    <footer class="statusbar">
      Ready
    </footer>

  </div>
</template>

<script setup lang="ts">
import LocalExplorer from "../renderer/components/LocalExplorer.vue";
import ConnectionPanel from "../renderer/components/ConnectionPanel.vue";
import RemoteExplorer from "../renderer/components/RemoteExplorer.vue";
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

.workspace{
    flex:1;
    display:flex;
}

.pane{
    flex:1;
    border-right:1px solid #444;
    padding:15px;
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