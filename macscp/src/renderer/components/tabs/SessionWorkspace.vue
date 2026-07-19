<template>
  <div class="session-workspace">
    <ConnectionPanel :tab-id="tabId" />
    <main class="workspace">
      <section class="pane"><LocalExplorer :tab-id="tabId" /></section>
      <section class="pane"><RemoteExplorer :tab-id="tabId" /></section>
    </main>
    <CodeEditor :tab-id="tabId" />
    <SshTerminal :tab-id="tabId" />
    <TransferPopup :tab-id="tabId" />
    <StatusBar :tab-id="tabId" />
    <SessionPathSync :tab-id="tabId" />
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from "vue";
import ConnectionPanel from "../ConnectionPanel.vue";
import LocalExplorer from "../LocalExplorer.vue";
import RemoteExplorer from "../RemoteExplorer.vue";
import StatusBar from "../StatusBar.vue";
import SessionPathSync from "../sessions/SessionPathSync.vue";
import TransferPopup from "../transfers/TransferPopup.vue";
import SshTerminal from "../terminal/SshTerminal.vue";
import CodeEditor from "../editor/CodeEditor.vue";
import { useTabStore } from "../../stores/tabStore";

const props = defineProps<{ tabId: string }>();
const tabStore = useTabStore();
const tab = computed(() => tabStore.tabsById[props.tabId]);
let compareTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => [tab.value.localPath, tab.value.remotePath, tab.value.connection.state],
  () => {
    if (tab.value.connection.state !== "connected") return;
    if (compareTimer) clearTimeout(compareTimer);
    compareTimer = setTimeout(async () => {
      const current = tabStore.tabsById[props.tabId];
      if (!current || current.connection.state !== "connected") return;
      current.compareEntries = await window.macscp.compare.directories(
        props.tabId,
        current.localPath,
        current.remotePath
      );
      current.compareVisible = true;
    }, 500);
  }
);

onUnmounted(() => {
  if (compareTimer) clearTimeout(compareTimer);
});
</script>

<style scoped>
.session-workspace { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.workspace { flex: 1; display: flex; min-height: 0; overflow: hidden; }
.pane { flex: 1; min-width: 0; min-height: 0; overflow: hidden; border-right: 1px solid #444; }
</style>
