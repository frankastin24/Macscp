<template>
  <section class="terminal" :class="{ expanded }">
    <header>
      <strong>SSH Terminal</strong>
      <div class="actions">
        <span v-if="error" class="error">{{ error }}</span>
        <button @click="toggle">{{ expanded ? "Hide Terminal" : "Show Terminal" }}</button>
        <button v-if="started" @click="close">Close Terminal</button>
      </div>
    </header>
    <div v-show="expanded" ref="terminalElement" class="terminal-screen"></div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useTabStore } from "../../stores/tabStore";

const props = defineProps<{ tabId: string }>();
const tabStore = useTabStore();
const expanded = ref(false);
const started = ref(false);
const error = ref("");
const terminalElement = ref<HTMLElement | null>(null);
const fitAddon = new FitAddon();
let terminal: Terminal | null = null;
let resizeObserver: ResizeObserver | null = null;
let removeDataListener: (() => void) | null = null;
let removeClosedListener: (() => void) | null = null;

async function toggle() {
  expanded.value = !expanded.value;
  if (!expanded.value) return;
  await nextTick();
  fit();
  if (!started.value) await start();
  terminal?.focus();
}

async function start() {
  const tab = tabStore.tabsById[props.tabId];
  if (tab.connection.state !== "connected") {
    error.value = "Connect this tab first";
    terminal?.writeln("\x1b[31mConnect this tab before opening the SSH terminal.\x1b[0m");
    return;
  }

  try {
    error.value = "";
    terminal?.clear();
    terminal?.writeln("\x1b[90mOpening interactive SSH shell...\x1b[0m");
    await window.macscp.terminal.start(props.tabId);
    started.value = true;
    fit();
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "Failed to open terminal";
    terminal?.writeln(`\r\n\x1b[31m${error.value}\x1b[0m`);
  }
}

async function close() {
  try {
    await window.macscp.terminal.close(props.tabId);
  } catch {
    // The tab connection may already be closing.
  }
  started.value = false;
  terminal?.writeln("\r\n\x1b[90mSSH terminal closed.\x1b[0m");
}

function fit() {
  if (!expanded.value || !terminalElement.value) return;
  try {
    fitAddon.fit();
  } catch {
    return;
  }
  if (started.value) {
    void window.macscp.terminal.resize(props.tabId, terminal!.cols, terminal!.rows);
  }
}

onMounted(() => {
  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: "block",
    convertEol: false,
    scrollback: 10_000,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 13,
    lineHeight: 1.15,
    theme: {
      background: "#090b09",
      foreground: "#d8e6d4",
      cursor: "#8ee68e",
      cursorAccent: "#090b09",
      selectionBackground: "#315a7d",
      black: "#1b1d1e",
      red: "#f92672",
      green: "#a6e22e",
      yellow: "#f4bf75",
      blue: "#66d9ef",
      magenta: "#ae81ff",
      cyan: "#5fd7ff",
      white: "#f8f8f2",
      brightBlack: "#75715e",
      brightRed: "#ff669d",
      brightGreen: "#beed5f",
      brightYellow: "#ffd98a",
      brightBlue: "#8be9fd",
      brightMagenta: "#c9a5ff",
      brightCyan: "#8be9fd",
      brightWhite: "#ffffff",
    },
  });
  terminal.loadAddon(fitAddon);
  terminal.open(terminalElement.value!);
  terminal.onData(data => {
    if (started.value) void window.macscp.terminal.write(props.tabId, data);
  });
  terminal.onResize(({ cols, rows }) => {
    if (started.value) void window.macscp.terminal.resize(props.tabId, cols, rows);
  });

  removeDataListener = window.macscp.terminal.onData(payload => {
    if (payload.tabId === props.tabId) terminal?.write(payload.data);
  });
  removeClosedListener = window.macscp.terminal.onClosed(payload => {
    if (payload.tabId !== props.tabId) return;
    started.value = false;
    terminal?.writeln("\r\n\x1b[90mSSH shell exited.\x1b[0m");
  });

  resizeObserver = new ResizeObserver(fit);
  resizeObserver.observe(terminalElement.value!);
});

onUnmounted(() => {
  removeDataListener?.();
  removeClosedListener?.();
  resizeObserver?.disconnect();
  if (started.value) void window.macscp.terminal.close(props.tabId).catch((): void => {});
  terminal?.dispose();
});
</script>

<style scoped>
.terminal { flex: 0 0 auto; background: #151515; border-top: 1px solid #444; color: #ddd; }
header { height: 34px; display: flex; align-items: center; justify-content: space-between; padding: 0 9px; }
.actions { display: flex; align-items: center; gap: 8px; }
.error { color: #ff8989; font-size: 12px; }
button { background: #292929; color: white; border: 1px solid #555; padding: 4px 9px; }
.terminal-screen { height: 300px; min-height: 180px; padding: 6px; background: #090b09; }
.terminal-screen :deep(.xterm) { height: 100%; }
.terminal-screen :deep(.xterm-viewport) { scrollbar-color: #555 #111; }
</style>
