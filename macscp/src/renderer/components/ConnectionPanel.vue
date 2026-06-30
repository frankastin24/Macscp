<template>
  <div class="connection-panel">
    <input v-model="host" placeholder="Host" />
    <input v-model.number="port" placeholder="Port" />
    <input v-model="username" placeholder="Username" />
    <input v-model="password" placeholder="Password" type="password" />

    <button @click="test" :disabled="loading">
      {{ loading ? "Testing..." : "Test Connection" }}
    </button>
    <button @click="addTestTransfer">Add Test Transfer</button>
    <button @click="uploadSelected">Upload Selected</button>
<button @click="downloadSelected">Download Selected</button>
<button @click="compareDirectories">Compare</button>
    <span>{{ status }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const host = ref("tradeely.com");
const port = ref(22);
const username = ref("root");
const password = ref("Fa2018@london");
const loading = ref(false);
const status = ref("");

async function test() {
  loading.value = true;
  status.value = "";

  try {
    await window.macscp.sftp.connect({
      host: host.value,
      port: port.value,
      username: username.value,
      password: password.value,
    });

    status.value = "Connected";
    window.dispatchEvent(new CustomEvent("macscp:sftp-connected"));

    status.value = "Connected successfully";
  } catch (err) {
    status.value = err instanceof Error ? err.message : "Connection failed";
  } finally {
    loading.value = false;
  }
}
import { useTransferStore } from "../stores/transferStore";

const transferStore = useTransferStore();

function addTestTransfer() {
 window.macscp.transfers.enqueue({
  id: crypto.randomUUID(),
  direction: "upload",
  sourcePath: "/local/test.txt",
  targetPath: "/remote/test.txt",
  filename: "test.txt",
  status: "queued",
  progress: 0,
  bytesTransferred: 0,
  totalBytes: 100,
  createdAt: Date.now(),
});
}

import type { FileEntry } from "../../shared/filesystem/FileEntry";

import { useExplorerStore } from "../stores/explorerStore";

const explorerStore = useExplorerStore();

import { joinRemotePath } from "../../shared/utils/remotePath";


import { formatSize } from "../../../shared/utils/formatSize";
import { formatDate } from "../../../shared/utils/formatDate";

async function uploadSelected() {
  for (const entry of explorerStore.localSelection) {
    if (entry.type !== "file") continue;

    await window.macscp.transfers.enqueue({
      id: crypto.randomUUID(),
      direction: "upload",
      sourcePath: entry.path,
      targetPath: joinRemotePath(explorerStore.remotePath, entry.name),
      filename: entry.name,
      status: "queued",
      progress: 0,
      bytesTransferred: 0,
      totalBytes: entry.size,
      createdAt: Date.now(),
    });
  }
}

async function downloadSelected() {
  for (const entry of explorerStore.remoteSelection) {
    if (entry.type !== "file") continue;

    await window.macscp.transfers.enqueue({
      id: crypto.randomUUID(),
      direction: "download",
      sourcePath: entry.path,
      targetPath: joinRemotePath(explorerStore.localPath, entry.name)   ,
      filename: entry.name,
      status: "queued",
      progress: 0,
      bytesTransferred: 0,
      totalBytes: entry.size,
      createdAt: Date.now(),
    });
  }
}
import { useCompareStore } from "../stores/compareStore";

const compareStore = useCompareStore();

async function compareDirectories() {
  await compareStore.compare(
    explorerStore.localPath,
    explorerStore.remotePath
  );
}
</script>

<style scoped>
.connection-panel {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #252525;
  border-bottom: 1px solid #444;
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
</style>
