<template>
  <section v-if="document" class="editor-panel">
    <header>
      <div class="file-title">
        <strong>{{ document.name }}<span v-if="dirty"> •</span></strong>
        <span>{{ document.side }} · {{ document.path }}</span>
      </div>
      <div class="actions">
        <span v-if="document.error" class="error">{{ document.error }}</span>
        <span v-if="document.loading">Loading…</span>
        <button :disabled="document.loading || document.saving || !dirty" @click="save">
          {{ document.saving ? "Saving…" : "Save" }}
        </button>
        <button @click="store.close(tabId)">Close</button>
      </div>
    </header>
    <div ref="editorElement" class="editor"></div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { basicSetup } from "codemirror";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { useEditorStore } from "../../stores/editorStore";
import { useRefreshStore } from "../../stores/refreshStore";

const props = defineProps<{ tabId: string }>();
const store = useEditorStore();
const refreshStore = useRefreshStore();
const document = computed(() => store.documents[props.tabId]);
const dirty = computed(() => document.value?.content !== document.value?.savedContent);
const editorElement = ref<HTMLElement | null>(null);
let view: EditorView | null = null;

watch(
  () => [document.value?.path, document.value?.loading],
  async () => {
    view?.destroy();
    view = null;
    if (!document.value || document.value.loading || document.value.error) return;
    await nextTick();
    if (!editorElement.value || !document.value) return;

    view = new EditorView({
      parent: editorElement.value,
      state: EditorState.create({
        doc: document.value.content,
        extensions: [
          basicSetup,
          oneDark,
          languageFor(document.value.name),
          EditorView.lineWrapping,
          keymap.of([{
            key: "Mod-s",
            preventDefault: true,
            run: () => { void save(); return true; },
          }]),
          EditorView.updateListener.of(update => {
            if (update.docChanged && document.value) {
              document.value.content = update.state.doc.toString();
            }
          }),
        ],
      }),
    });
    view.focus();
  },
  { immediate: true }
);

async function save() {
  const side = document.value?.side;
  await store.save(props.tabId);
  if (document.value?.error) return;
  if (side === "local") refreshStore.refreshLocal(props.tabId);
  if (side === "remote") refreshStore.refreshRemote(props.tabId);
}

function languageFor(filename: string): Extension {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (["js", "jsx", "mjs", "cjs"].includes(extension || "")) return javascript({ jsx: true });
  if (["ts", "tsx", "mts", "cts", "vue"].includes(extension || "")) return javascript({ typescript: true, jsx: extension === "tsx" });
  if (["html", "htm", "xml", "svg"].includes(extension || "")) return html();
  if (["css", "scss", "sass", "less"].includes(extension || "")) return css();
  if (["json", "jsonc"].includes(extension || "")) return json();
  if (["md", "markdown"].includes(extension || "")) return markdown();
  return [];
}

onUnmounted(() => view?.destroy());
</script>

<style scoped>
.editor-panel { flex: 0 0 42%; min-height: 220px; display: flex; flex-direction: column; border-top: 1px solid #555; background: #1e1e1e; color: #ddd; }
header { min-height: 40px; padding: 5px 9px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #252526; }
.file-title { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.file-title strong { color: white; }
.file-title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #999; font-size: 11px; }
.actions { display: flex; align-items: center; gap: 7px; font-size: 12px; }
.error { max-width: 360px; color: #ff8e8e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
button { padding: 4px 10px; color: white; background: #333; border: 1px solid #666; }
button:disabled { opacity: .45; }
.editor { flex: 1; min-height: 0; overflow: hidden; }
.editor :deep(.cm-editor) { height: 100%; }
.editor :deep(.cm-scroller) { overflow: auto; }
</style>
