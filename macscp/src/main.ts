import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { ipcMain } from "electron";
import { explorerService } from "./backend/filesystem/ExplorerService";
import { sftpService } from "./backend/sftp/SftpService";
import { transferManager } from "./backend/transfers/TransferManager";
import { IPC_CHANNELS } from "./shared/ipc/IpcChannels";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
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

ipcMain.handle("sftp:testConnection", async (_event, config) => {
  return sftpService.testConnection(config);
});

ipcMain.handle("sftp:connect", async (_event, config) => {
  return sftpService.connect(config);
});

ipcMain.handle("sftp:listDirectory", async (_event, remotePath?: string) => {
  return sftpService.listDirectory(remotePath);
});

ipcMain.handle("sftp:disconnect", async () => {
  return sftpService.disconnect();
});

ipcMain.handle(IPC_CHANNELS.transferEnqueue, async (_event, item) => {
  return transferManager.enqueue(item);
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
