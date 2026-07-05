<template>
  <div class="breadcrumbs">
    <button
      v-for="segment in segments"
      :key="segment.path"
      @click="$emit('navigate', segment.path)"
    >
      {{ segment.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  path: string;
  side: "local" | "remote";
}>();

defineEmits<{
  navigate: [path: string];
}>();

const segments = computed(() => {
  if (props.path === "Home") {
    return [{ label: "Home", path: "Home" }];
  }

  if (props.path === ".") {
    return [{ label: ".", path: "." }];
  }

  const isAbsolute = props.path.startsWith("/");
  const parts = props.path.split("/").filter(Boolean);

  const result = [
    {
      label: isAbsolute ? "/" : ".",
      path: isAbsolute ? "/" : ".",
    },
  ];

  let current = isAbsolute ? "" : ".";

  for (const part of parts) {
    current = isAbsolute
      ? `${current}/${part}`
      : current === "."
        ? part
        : `${current}/${part}`;

    result.push({
      label: part,
      path: current,
    });
  }

  return result;
});
</script>

<style scoped>
.breadcrumbs {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid #444;
  background: #202020;
  overflow-x: auto;
}

button {
  background: #303030;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 3px 7px;
  font-size: 12px;
  white-space: nowrap;
}

button:hover {
  background: #3d3d3d;
}
</style>