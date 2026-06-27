import type { FileEntry } from "../../shared/filesystem/FileEntry";
import type { CompareEntry, CompareStatus } from "../../shared/compare/CompareEntry";

export class CompareEngine {
  compare(localEntries: FileEntry[], remoteEntries: FileEntry[]): CompareEntry[] {
    const localMap = new Map(localEntries.map(entry => [entry.name, entry]));
    const remoteMap = new Map(remoteEntries.map(entry => [entry.name, entry]));

    const names = new Set<string>([
      ...localEntries.map(entry => entry.name),
      ...remoteEntries.map(entry => entry.name),
    ]);

    return [...names]
      .map(name => {
        const local = localMap.get(name);
        const remote = remoteMap.get(name);

        return {
          name,
          local,
          remote,
          status: this.getStatus(local, remote),
        };
      })
      .sort((a, b) => {
        const aDir = a.local?.type === "directory" || a.remote?.type === "directory";
        const bDir = b.local?.type === "directory" || b.remote?.type === "directory";

        if (aDir && !bDir) return -1;
        if (!aDir && bDir) return 1;

        return a.name.localeCompare(b.name);
      });
  }

  private getStatus(local?: FileEntry, remote?: FileEntry): CompareStatus {
    if (local && !remote) return "local-only";
    if (!local && remote) return "remote-only";

    if (!local || !remote) return "different";

    if (local.type !== remote.type) return "different";

    if (local.type === "directory" && remote.type === "directory") {
      return "identical";
    }

    const sameSize = local.size === remote.size;
    const timeDiff = Math.abs(local.modifiedAt - remote.modifiedAt);

    if (sameSize && timeDiff < 2000) {
      return "identical";
    }

    if (local.modifiedAt > remote.modifiedAt) return "local-newer";
    if (remote.modifiedAt > local.modifiedAt) return "remote-newer";

    return "different";
  }
}

export const compareEngine = new CompareEngine();