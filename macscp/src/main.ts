import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { explorerService } from "./backend/filesystem/ExplorerService";
import { sftpConnectionRegistry } from "./backend/sftp/SftpConnectionRegistry";
import { transferManager } from "./backend/transfers/TransferManager";
import { IPC_CHANNELS } from "./shared/ipc/IpcChannels";
import { compareEngine } from "./backend/compare/CompareEngine";
import { sessionService } from "./backend/sessions/SessionService"; 
import { watchSyncManager } from "./backend/watch/WatchSyncManager";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

ipcMain.handle("local:listDirectory", async (_event, dirPath?: string) => {
  return explorerService.listLocalDirectory(dirPath);
});

ipcMain.handle(IPC_CHANNELS.localDelete, async (_event, targetPath: string) => {
  return explorerService.deleteLocalPath(targetPath);
});

ipcMain.handle(IPC_CHANNELS.fileReadLocal, async (_event, targetPath: string) => {
  return explorerService.readLocalFile(targetPath);
});

ipcMain.handle(IPC_CHANNELS.fileWriteLocal, async (_event, request) => {
  return explorerService.writeLocalFile(request.path, request.content);
});

ipcMain.handle(IPC_CHANNELS.sftpConnect, async (_event, request) => {
  return sftpConnectionRegistry.connect(request.tabId, request.config);
});

ipcMain.handle(IPC_CHANNELS.sftpDisconnect, async (_event, tabId: string) => {
  return sftpConnectionRegistry.disconnect(tabId);
});

ipcMain.handle(IPC_CHANNELS.sftpListDirectory, async (_event, request) => {
  return sftpConnectionRegistry.get(request.tabId).listDirectory(request.remotePath);
});

ipcMain.handle(IPC_CHANNELS.sftpDelete, async (_event, request) => {
  return sftpConnectionRegistry.get(request.tabId).deletePath(request.remotePath, request.type);
});

ipcMain.handle(IPC_CHANNELS.fileReadRemote, async (_event, request) => {
  return sftpConnectionRegistry.get(request.tabId).readFile(request.path);
});

ipcMain.handle(IPC_CHANNELS.fileWriteRemote, async (_event, request) => {
  return sftpConnectionRegistry.get(request.tabId).writeFile(request.path, request.content);
});

ipcMain.handle(IPC_CHANNELS.terminalStart, async (event, tabId: string) => {
  const webContents = event.sender;
  await sftpConnectionRegistry.get(tabId).startShell(
    data => webContents.send(IPC_CHANNELS.terminalData, { tabId, data }),
    () => webContents.send(IPC_CHANNELS.terminalClosed, { tabId })
  );
});

ipcMain.handle(IPC_CHANNELS.terminalWrite, async (_event, request) => {
  sftpConnectionRegistry.get(request.tabId).writeShell(request.data);
});

ipcMain.handle(IPC_CHANNELS.terminalResize, async (_event, request) => {
  sftpConnectionRegistry.get(request.tabId).resizeShell(request.cols, request.rows);
});

ipcMain.handle(IPC_CHANNELS.terminalClose, async (_event, tabId: string) => {
  sftpConnectionRegistry.get(tabId).closeShell();
});

ipcMain.handle(IPC_CHANNELS.transferEnqueue, async (_event, item) => {
  return transferManager.enqueue(item);
});
ipcMain.handle(
  IPC_CHANNELS.compareDirectories,
  async (_event, request) => {
    const localEntries = await explorerService.listLocalDirectory(request.localPath);
    const remoteEntries = await sftpConnectionRegistry
      .get(request.tabId)
      .listDirectory(request.remotePath);

    return compareEngine.compare(localEntries, remoteEntries);
  }
);
ipcMain.handle(IPC_CHANNELS.walkLocalDirectory, async (_event, dirPath: string) => {
  return explorerService.walkLocalDirectory(dirPath);
});

ipcMain.handle(IPC_CHANNELS.walkRemoteDirectory, async (_event, request) => {
  return sftpConnectionRegistry.get(request.tabId).walkDirectory(request.remotePath);
});

ipcMain.handle(IPC_CHANNELS.sessionList, async () => {
  return sessionService.list();
});

ipcMain.handle(IPC_CHANNELS.sessionSave, async (_event, session, password?: string) => {
  const encryptedPassword = password
    ? sessionService.encryptPassword(password)
    : session.encryptedPassword;

  return sessionService.save({
    ...session,
    encryptedPassword,
    hasPassword: Boolean(encryptedPassword),
  });
});

ipcMain.handle("session:getDecryptedPassword", async (_event, sessionId: string) => {
  const sessions = await sessionService.list();
  const session = sessions.find(item => item.id === sessionId);

  if (!session?.encryptedPassword) return "";

  return sessionService.decryptPassword(session.encryptedPassword);
});

ipcMain.handle(IPC_CHANNELS.sessionDelete, async (_event, id: string) => {
  return sessionService.delete(id);
});

ipcMain.handle(IPC_CHANNELS.watchStart, async (_event, config) => {
  return watchSyncManager.start(config);
});

ipcMain.handle(IPC_CHANNELS.watchStop, async (_event, tabId: string) => {
  return watchSyncManager.stop(tabId);
});

ipcMain.handle(IPC_CHANNELS.tabDispose, async (_event, tabId: string) => {
  if (transferManager.hasActive(tabId)) transferManager.cancelForTab(tabId);
  await watchSyncManager.stop(tabId);
  await sftpConnectionRegistry.disconnect(tabId);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  void watchSyncManager.stopAll();
  void sftpConnectionRegistry.disconnectAll();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
