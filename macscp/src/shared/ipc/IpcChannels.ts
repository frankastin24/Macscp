export const IPC_CHANNELS = {
  transferEnqueue: "transfer:enqueue",
  transferProgress: "transfer:progress",
  compareDirectories: "compare:directories",
  walkLocalDirectory: "local:walkDirectory",
  walkRemoteDirectory: "sftp:walkDirectory",
  sessionList: "session:list",
  sessionSave: "session:save",
  sessionDelete: "session:delete",
  watchStart: "watch:start",
  watchStop: "watch:stop",
  watchStatus: "watch:status",
} as const;