<template></template>

<script setup lang="ts">
import { onUnmounted, watch } from "vue";
import { useSessionStore } from "../../stores/sessionStore";
import { useTabStore } from "../../stores/tabStore";
const props = defineProps<{ tabId: string }>();

const sessionStore = useSessionStore();
const tabStore = useTabStore();

let timer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => [tabStore.tabsById[props.tabId].localPath, tabStore.tabsById[props.tabId].remotePath],
  ([localPath, remotePath]) => {
    const sessionId = tabStore.tabsById[props.tabId].sessionId;
    if (!sessionId) return;

    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      sessionStore.updateSessionPaths(sessionId, localPath, remotePath);
    }, 500);
  }
);

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>
