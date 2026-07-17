<template></template>

<script setup lang="ts">
import { watch } from "vue";
import { useExplorerStore } from "../../stores/explorerStore";
import { useSessionStore } from "../../stores/sessionStore";

const explorerStore = useExplorerStore();
const sessionStore = useSessionStore();

let timer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => [explorerStore.localPath, explorerStore.remotePath],
  ([localPath, remotePath]) => {
    if (!sessionStore.activeSessionId) return;

    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      sessionStore.updateActiveSessionPaths(localPath, remotePath);
    }, 500);
  }
);
</script>