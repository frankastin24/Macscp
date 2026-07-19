<template>
  <div v-if="tab.transferPopupVisible" class="overlay">
    <section class="popup" role="dialog" aria-modal="true" aria-labelledby="sync-title">
      <header>
        <div>
          <strong id="sync-title">Watch synchronization</strong>
          <div class="summary">{{ summary }}</div>
        </div>
        <strong>{{ overallProgress }}%</strong>
      </header>

      <div class="progress overall-progress">
        <div class="bar" :style="{ width: `${overallProgress}%` }"></div>
      </div>

      <div class="files">
        <div v-if="!currentItem" class="empty">
          {{ idleMessage }}
        </div>
        <div v-else class="file-row">
          <div class="file-heading">
            <span class="direction">{{ currentItem.direction === "upload" ? "Upload" : "Download" }}</span>
            <span class="name" :title="currentItem.sourcePath">{{ currentItem.filename }}</span>
            <span class="status" :class="currentItem.status">{{ currentItem.status }}</span>
          </div>
          <div class="progress">
            <div
              class="bar"
              :class="{ failed: currentItem.status === 'failed' }"
              :style="{ width: `${currentItem.progress}%` }"
            ></div>
          </div>
          <div class="meta">
            {{ formatSize(currentItem.bytesTransferred) }} / {{ formatSize(currentItem.totalBytes) }}
            <span v-if="currentItem.error" class="error">{{ currentItem.error }}</span>
          </div>
        </div>
      </div>

      <footer>
        <span>{{ completedCount }} completed · {{ failedCount }} failed · {{ pendingCount }} remaining</span>
        <div class="actions">
          <button v-if="tab.watching" class="stop" @click="stopWatchSync">
            Stop Watch Sync
          </button>
          <button @click="closePopup">{{ closeLabel }}</button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatSize } from "../../../shared/utils/formatSize";
import { useTransferPopup } from "../../composables/useTransferPopup";
const props = defineProps<{ tabId: string }>();

const {
  tab, currentItem, completedCount, failedCount, pendingCount,
  overallProgress, summary, closeLabel, idleMessage, stopWatchSync, closePopup,
} = useTransferPopup(props.tabId);
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.48);
}
.popup {
  width: min(680px, calc(100vw - 48px));
  max-height: min(620px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  padding: 18px;
  color: white;
  background: #202020;
  border: 1px solid #666;
  border-radius: 8px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55);
}
header, footer, .file-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.summary, .meta, footer { color: #aaa; font-size: 12px; }
.summary { margin-top: 4px; }
.overall-progress { margin: 14px 0; height: 12px; }
.files { overflow: auto; border-top: 1px solid #444; border-bottom: 1px solid #444; }
.empty { padding: 28px 12px; color: #aaa; text-align: center; font-size: 13px; }
.file-row { padding: 11px 2px; border-bottom: 1px solid #333; }
.file-row:last-child { border-bottom: 0; }
.direction { width: 72px; color: #aaa; font-size: 12px; }
.name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status { text-transform: capitalize; font-size: 12px; }
.status.completed { color: #70cf88; }
.status.failed, .error { color: #ff7777; }
.progress { height: 8px; margin: 7px 0 5px; overflow: hidden; background: #333; border-radius: 999px; }
.bar { height: 100%; background: #4aa3ff; transition: width 120ms linear; }
.bar.failed { background: #d9534f; }
.error { float: right; margin-left: 12px; }
footer { margin-top: 14px; }
.actions { display: flex; gap: 8px; }
button { padding: 5px 14px; color: white; background: #333; border: 1px solid #666; }
.stop { border-color: #a65353; color: #ffb3b3; }
</style>
