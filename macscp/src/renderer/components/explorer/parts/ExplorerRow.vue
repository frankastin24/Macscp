<template>
  <div
    class="row"
    :class="[compareStatus, { selected }]"
    draggable="true"
    @click="emitPointerEvent('select', $event)"
    @dblclick="$emit('open', entry)"
    @contextmenu.prevent="emitPointerEvent('context', $event)"
    @dragstart="$emit('drag-start', entry)"
  >
    <div class="cell status">{{ compareLabel }}</div>
    <div class="cell name">
      <span class="icon">{{ icon }}</span>
      <span>{{ entry.name }}</span>
    </div>
    <div class="cell size">
      {{ entry.type === "directory" ? "" : formatSize(entry.size) }}
    </div>
    <div class="cell modified">
      {{ formatDate(entry.modifiedAt) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FileEntry } from "../../../../shared/filesystem/FileEntry";
import type { CompareStatus } from "../../../../shared/compare/CompareEntry";
import { formatSize } from "../../../../shared/utils/formatSize";
import { formatDate } from "../../../../shared/utils/formatDate";

const props = defineProps<{
  entry: FileEntry;
  index: number;
  selected: boolean;
  compareStatus?: CompareStatus | "";
}>();

const emit = defineEmits<{
  select: [payload: { entry: FileEntry; index: number; event: MouseEvent }];
  open: [entry: FileEntry];
  context: [payload: { entry: FileEntry; index: number; event: MouseEvent }];
  "drag-start": [entry: FileEntry];
}>();

function emitPointerEvent(type: "select" | "context", event: MouseEvent) {
  const payload = { entry: props.entry, index: props.index, event };
  if (type === "select") {
    emit("select", payload);
  } else {
    emit("context", payload);
  }
}

const icon = computed(() => {
  if (props.entry.type === "directory") return "📁";

  const ext = props.entry.name.split(".").pop()?.toLowerCase();

  const icons: Record<string, string> = {
    html: "🌐",
    css: "🎨",
    js: "🟨",
    ts: "🔷",
    vue: "🟩",
    json: "📦",
    md: "📝",
    png: "🖼",
    jpg: "🖼",
    jpeg: "🖼",
    gif: "🖼",
    svg: "🖼",
    mp3: "🎵",
    wav: "🎵",
    mp4: "🎬",
    mov: "🎬",
    zip: "🗜",
  };

  return ext ? icons[ext] || "📄" : "📄";
});

const compareLabel = computed(() => {
  const labels: Record<string, string> = {
    identical: "✓",
    "local-only": "↑",
    "remote-only": "↓",
    "local-newer": "↑ newer",
    "remote-newer": "↓ newer",
    different: "⚠",
  };

  return labels[props.compareStatus || ""] || "";
});
</script>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 85px minmax(180px, 1fr) 110px 180px;
  align-items: center;
  min-height: 30px;
  font-size: 13px;
  border-bottom: 1px solid #333;
  cursor: default;
  user-select: none;
}

.row:hover {
  background: #333;
}

.cell {
  padding: 6px 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.name {
  display: flex;
  gap: 8px;
  align-items: center;
}

.status {
  color: #aaa;
}

.selected {
  background: #1f5f99;
  color: white;
}

.selected:hover {
  background: #2670b8;
}

.identical {
  color: #999;
}

.local-only,
.local-newer {
  color: #7ec8ff;
}

.remote-only,
.remote-newer {
  color: #ffc66d;
}

.different {
  color: #ff7777;
}
</style>
