<template>
  <Explorer
    title="Local"
    :status="explorer.currentPath.value"
    :entries="explorer.entries.value"
    :current-path="explorer.currentPath.value"
    :error="explorer.error.value"
    :can-go-parent="explorer.currentPath.value !== 'Home' && explorer.currentPath.value !== '/'"
    @open="explorer.open"
    @refresh="explorer.refresh"
    @go-parent="explorer.goParent"
    @go-path="explorer.goToPath"
    @selection-change="explorer.setSelection"
    :compare-entries="compareStore.visible ? compareStore.entries : []"
  />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import Explorer from "./Explorer.vue";
import { useExplorer } from "../composables/useExplorer";
import { useExplorerStore } from "../stores/explorerStore";
import { useCompareStore } from "../stores/compareStore";
const explorerStore = useExplorerStore();
const compareStore = useCompareStore();
const explorer = useExplorer({
  side: "local",
  initialPath: "Home",
  listDirectory: path => window.macscp.local.listDirectory(path === "Home" ? undefined : path),
  onPathChange: path => explorerStore.setLocalPath(path),
  onSelectionChange: entries => explorerStore.setLocalSelection(entries),
});

onMounted(() => explorer.load());
</script>