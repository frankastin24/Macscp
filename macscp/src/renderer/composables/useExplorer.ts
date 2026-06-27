import { ref } from "vue";
import type { FileEntry } from "../../shared/filesystem/FileEntry";

export type ExplorerSide = "local" | "remote";

interface UseExplorerOptions {
  side: ExplorerSide;
  initialPath: string;
  listDirectory: (path?: string) => Promise<FileEntry[]>;
  onPathChange?: (path: string) => void;
  onSelectionChange?: (entries: FileEntry[]) => void;
}

export function useExplorer(options: UseExplorerOptions) {
  const entries = ref<FileEntry[]>([]);
  const selectedEntries = ref<FileEntry[]>([]);
  const currentPath = ref(options.initialPath);
  const error = ref("");
  const loading = ref(false);

  async function load(path?: string) {
    loading.value = true;
    error.value = "";

    try {
      entries.value = await options.listDirectory(path);

      if (path) {
        currentPath.value = path;
      } else if (options.side === "local" && entries.value.length > 0) {
        currentPath.value = entries.value[0].path
          .split("/")
          .slice(0, -1)
          .join("/");
      } else {
        currentPath.value = options.initialPath;
      }

      selectedEntries.value = [];
      options.onSelectionChange?.([]);
      options.onPathChange?.(currentPath.value);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load directory";
    } finally {
      loading.value = false;
    }
  }

  function open(entry: FileEntry) {
    if (entry.type === "directory") {
      load(entry.path);
    }
  }

  function refresh() {
    load(currentPath.value);
  }

  function goParent() {
    if (currentPath.value === "Home" || currentPath.value === "." || currentPath.value === "/") {
      return;
    }

    const parts = currentPath.value.split("/").filter(Boolean);
    parts.pop();

    const parent = parts.length ? "/" + parts.join("/") : "/";
    load(parent);
  }

  function goToPath(path: string) {
    if (!path.trim()) return;

    if (options.side === "local" && path === "Home") {
      load();
      return;
    }

    load(path.trim());
  }

  function setSelection(entries: FileEntry[]) {
    selectedEntries.value = entries;
    options.onSelectionChange?.(entries);
  }

  return {
    entries,
    selectedEntries,
    currentPath,
    error,
    loading,
    load,
    open,
    refresh,
    goParent,
    goToPath,
    setSelection,
  };
}