<template>
  <div class="connection-panel">
    <input v-model="tab.connection.host" placeholder="Host" />
    <input v-model.number="tab.connection.port" placeholder="Port" />
    <input v-model="tab.connection.username" placeholder="Username" />
    <input v-model="tab.connection.password" placeholder="Password" type="password" />

    <button @click="connect" :disabled="loading">
      {{ loading ? "Connecting..." : "Connect" }}
    </button>
    <button @click="syncCompared()">Sync</button>
    <button @click="startWatchSync">Start Watch Sync</button>
    <button @click="showIgnoreRules = !showIgnoreRules">Ignore Rules</button>
    <span v-if="status" class="status">{{ status }}</span>
    <div v-if="showIgnoreRules" class="ignore-editor">
      <label for="ignore-rules">Sync ignore rules (one Gitignore-style pattern per line)</label>
      <textarea
        id="ignore-rules"
        v-model="ignoreText"
        rows="6"
        spellcheck="false"
        placeholder="# Comments are allowed&#10;.git/&#10;node_modules/&#10;*.tmp&#10;!important.tmp"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConnectionPanel } from "../composables/useConnectionPanel";
import { computed, ref } from "vue";
const props = defineProps<{ tabId: string }>();

const {
  tab,
  loading,
  status,
  connect,
  syncCompared,
  startWatchSync,
} = useConnectionPanel(props.tabId);

const showIgnoreRules = ref(false);
const ignoreText = computed({
  get: () => tab.value.ignorePatterns.join("\n"),
  set: value => {
    tab.value.ignorePatterns = value.split(/\r?\n/);
  },
});
</script>

<style scoped>
.connection-panel {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #252525;
  border-bottom: 1px solid #444;
  flex-wrap: wrap;
}

input {
  background: #1f1f1f;
  color: white;
  border: 1px solid #555;
  padding: 5px 8px;
}

button {
  background: #333;
  color: white;
  border: 1px solid #666;
  padding: 5px 10px;
}

.status {
  align-self: center;
  color: #aaa;
  font-size: 12px;
}

.ignore-editor {
  flex-basis: 100%;
  display: grid;
  gap: 6px;
  color: #aaa;
  font-size: 12px;
}

textarea {
  width: 100%;
  resize: vertical;
  padding: 8px;
  color: white;
  background: #181818;
  border: 1px solid #555;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
