export function joinRemotePath(base: string, name: string): string {
  if (base === "." || base === "") return name;
  if (base === "/") return `/${name}`;
  return `${base.replace(/\/$/, "")}/${name}`;
}