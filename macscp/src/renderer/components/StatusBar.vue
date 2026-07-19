<template>
  <footer class="statusbar">
    <span>{{ connection }}</span>
    <span>Local: {{ tab.localPath }}</span>
    <span>Remote: {{ tab.remotePath }}</span>
    <span>{{ running }} running</span>
    <span>{{ queued }} queued</span>
    <span>Local selected: {{ tab.localSelection.length }}</span>
    <span>Remote selected: {{ tab.remoteSelection.length }}</span>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTransferStore } from "../stores/transferStore";
import { useTabStore } from "../stores/tabStore";
const props = defineProps<{ tabId: string }>();

const tabStore = useTabStore();
const transferStore = useTransferStore();
const tab = computed(() => tabStore.tabsById[props.tabId]);
const items = computed(() => transferStore.itemsForTab(props.tabId));
const running = computed(() => items.value.filter(item => item.status === "running").length);
const queued = computed(() => items.value.filter(item => item.status === "queued").length);

const connection = computed(() =>
  tab.value.connection.state === "connected" ? "Connected" : "Not connected"
);
</script>

<style scoped>
.statusbar {
  height: 28px;
  background: #222;
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 10px;
  font-size: 12px;
  border-top: 1px solid #444;
}
</style>
