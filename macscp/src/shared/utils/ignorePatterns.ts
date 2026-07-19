function escapeRegex(value: string) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function patternRegex(pattern: string) {
  const anchored = pattern.startsWith("/");
  const directory = pattern.endsWith("/");
  const clean = pattern.replace(/^\//, "").replace(/\/$/, "");
  const glob = escapeRegex(clean)
    .replace(/\*\*/g, "::DOUBLE_STAR::")
    .replace(/\*/g, "[^/]*")
    .replace(/::DOUBLE_STAR::/g, ".*");
  const prefix = anchored ? "^" : "(^|.*/)";
  return new RegExp(`${prefix}${glob}${directory ? "(/.*)?" : "($|/.*)"}`);
}

export function isIgnored(relativePath: string, patterns: string[]) {
  const path = relativePath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\//, "");
  let ignored = false;
  for (const raw of patterns) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const negated = line.startsWith("!");
    const pattern = negated ? line.slice(1) : line;
    if (pattern && patternRegex(pattern).test(path)) ignored = !negated;
  }
  return ignored;
}
