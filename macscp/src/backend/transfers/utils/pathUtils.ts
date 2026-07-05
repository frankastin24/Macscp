import path from "node:path";

export function getRemoteDirectory(remotePath: string): string {
  const parts = remotePath.split("/").filter(Boolean);
  parts.pop();

  if (remotePath.startsWith("/")) {
    return "/" + parts.join("/");
  }

  return parts.join("/") || ".";
}

export function getLocalDirectory(localPath: string): string {
  return path.dirname(localPath);
}