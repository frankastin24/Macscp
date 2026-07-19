<template>
  <nav class="tabs">
    <button
      v-for="(tab, index) in store.tabs"
      :key="tab.tabId"
      class="tab"
      :class="{ active: tab.tabId === store.activeTabId }"
      draggable="true"
      @click="store.select(tab.tabId)"
      @dragstart="draggedId = tab.tabId"
      @dragover.prevent
      @drop="drop(index)"
    >
      <span class="state" :class="tab.connection.state">●</span>
      <span class="title">{{ tab.title }}</span>
      <span v-if="counts(tab.tabId)" class="badge">{{ counts(tab.tabId) }}</span>
      <span class="duplicate" title="Duplicate" @click.stop="store.duplicate(tab.tabId)">⧉</span>
      <span class="close" title="Close" @click.stop="close(tab.tabId)">×</span>
    </button>
    <button class="new" title="New session" @click="store.openBlank">+</button>
  </nav>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTabStore } from "../../stores/tabStore";
import { useTransferStore } from "../../stores/transferStore";
import { useEditorStore } from "../../stores/editorStore";

const store = useTabStore();
const transfers = useTransferStore();
const editors = useEditorStore();
const draggedId = ref("");

function counts(tabId: string) {
  return transfers.activeCountForTab(tabId);
}

function drop(index: number) {
  if (draggedId.value) store.move(draggedId.value, index);
  draggedId.value = "";
}

async function close(tabId: string) {
  const document = editors.documents[tabId];
  if (document && document.content !== document.savedContent &&
      !window.confirm("Discard unsaved editor changes and close this tab?")) return;
  if (transfers.activeCountForTab(tabId) && !window.confirm("Cancel queued transfers and close this tab?")) return;
  await store.close(tabId);
}
</script>

<style scoped>
.tabs { display: flex; gap: 2px; padding: 4px 6px 0; background: #181818; overflow-x: auto; }
.tab, .new { border: 1px solid #444; background: #252525; color: #ccc; padding: 7px 9px; display: flex; gap: 7px; align-items: center; }
.tab.active { background: #333; color: white; border-bottom-color: #333; }
.title { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.state { color: #777; font-size: 9px; }
.state.connected { color: #62c979; }
.state.connecting, .state.disconnecting { color: #e5b95c; }
.state.error { color: #e66; }
.badge { background: #286da8; border-radius: 10px; padding: 1px 6px; font-size: 11px; }
.duplicate, .close { cursor: pointer; color: #aaa; }
.close:hover { color: #ff8888; }
</style>
