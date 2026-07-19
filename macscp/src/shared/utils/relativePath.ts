export function relativePath(filePath: string, rootPath: string) {
  const file = filePath.replace(/\\/g, "/");
  const root = rootPath.replace(/\\/g, "/").replace(/\/$/, "");
  if (!root || root === ".") return file.replace(/^\.\//, "").replace(/^\//, "");
  if (root === "/") return file.replace(/^\//, "");
  return file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;
}
