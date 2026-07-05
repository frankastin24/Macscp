<template>
  <div v-if="visible && activeItem" class="overlay">
    <section class="popup">
      <header>
        <strong>{{ title }}</strong>
        <span>{{ activeItem.progress }}%</span>
      </header>

      <div class="file">
        <div class="label">Current file</div>
        <div class="name">{{ activeItem.filename }}</div>
      </div>

      <div class="progress">
        <div class="bar" :style="{ width: `${activeItem.progress}%` }"></div>
      </div>

      <div class="meta">
        {{ formatSize(activeItem.bytesTransferred) }}
        /
        {{ formatSize(activeItem.totalBytes) }}
      </div>

      <hr />

      <div class="file">
        <div class="label">Total progress</div>
        <div class="name">
          File {{ completedCount + runningCount }} of {{ totalCount }}
        </div>
      </div>

      <div class="progress">
        <div class="bar" :style="{ width: `${overallProgress}%` }"></div>
      </div>

      <div class="meta">
        {{ completedCount }} completed,
        {{ queuedCount }} queued,
        {{ failedCount }} failed
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTransferStore } from "../../stores/transferStore";
import { formatSize } from "../../../shared/utils/formatSize";

const store = useTransferStore();

const activeItem = computed(() =>
  store.items.find(item => item.status === "running") ||
  store.items.find(item => item.status === "queued") ||
  null
);
const visible = computed(() =>
  store.items.some(item => item.status === "queued" || item.status === "running")
);

const totalCount = computed(() => store.items.length);

const completedCount = computed(
  () => store.items.filter(item => item.status === "completed").length
);

const runningCount = computed(
  () => store.items.filter(item => item.status === "running").length
);

const queuedCount = computed(
  () => store.items.filter(item => item.status === "queued").length
);

const failedCount = computed(
  () => store.items.filter(item => item.status === "failed").length
);

const title = computed(() => {
  if (!activeItem.value) return "Transfer";

  return activeItem.value.direction === "upload"
    ? "Uploading"
    : "Downloading";
});

const overallProgress = computed(() => {
  if (!totalCount.value) return 0;

  const completed = completedCount.value;
  const current = activeItem.value?.progress ?? 0;

  return Math.round(((completed + current / 100) / totalCount.value) * 100);
});
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 24px;
}

.popup {
  width: 420px;
  background: #202020;
  border: 1px solid #555;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
  border-radius: 8px;
  padding: 14px;
  color: white;
  pointer-events: auto;
}

header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}

.file {
  margin-bottom: 8px;
}

.label {
  font-size: 11px;
  color: #999;
  margin-bottom: 3px;
}

.name {
  font-size: 13px;
  word-break: break-all;
}

.progress {
  height: 10px;
  background: #333;
  border: 1px solid #444;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 6px;
}

.bar {
  height: 100%;
  background: #4aa3ff;
}

.meta {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 10px;
}

hr {
  border: none;
  border-top: 1px solid #444;
  margin: 12px 0;
}
</style>