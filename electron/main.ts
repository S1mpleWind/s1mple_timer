import { app, BrowserWindow, ipcMain, Notification } from "electron";
import path from "node:path";

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 420,
    height: 560,
    icon: path.join(__dirname, "../build/icons/app.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // 渲染进程构建后的产物会在 dist 目录
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("notify-finished", async (_event, usedMinutes: number) => {
    const safeMinutes = Number.isFinite(usedMinutes) ? Math.max(1, Math.floor(usedMinutes)) : 1;
    new Notification({
      title: "S1mple Timer",
      body: `你已经使用电脑${safeMinutes}min了，休息一下眼睛，起身走走吧~`
    }).show();
    return true;
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
