import { app, BrowserWindow, ipcMain, Notification } from "electron";
import path from "node:path";

let win: BrowserWindow | null = null;

type TimerState = {
  running: boolean;
  endAt: number | null;
  durationSec: number;
  remainingSec: number;
};

const timerState: TimerState = {
  running: false,
  endAt: null,
  durationSec: 50 * 60,
  remainingSec: 50 * 60
};

let timerInterval: NodeJS.Timeout | null = null;

function getPublicTimerState() {
  return {
    running: timerState.running,
    durationSec: timerState.durationSec,
    remainingSec: timerState.remainingSec
  };
}

function publishTimerState() {
  if (win && !win.isDestroyed()) {
    win.webContents.send("timer:state", getPublicTimerState());
  }
}

function stopTicker() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function showFinishedNotification() {
  const usedMinutes = Math.max(1, Math.round(timerState.durationSec / 60));
  new Notification({
    title: "S1mple Timer",
    body: `你已经使用电脑${usedMinutes}min了，休息一下眼睛，起身走走吧~`
  }).show();
}

function tickTimer() {
  if (!timerState.running || !timerState.endAt) {
    return;
  }

  const nextRemain = Math.max(0, Math.ceil((timerState.endAt - Date.now()) / 1000));

  if (nextRemain !== timerState.remainingSec) {
    timerState.remainingSec = nextRemain;
    publishTimerState();
  }

  if (nextRemain <= 0) {
    timerState.running = false;
    timerState.endAt = null;
    stopTicker();
    showFinishedNotification();
    publishTimerState();
  }
}

function startTicker() {
  if (timerInterval) {
    return;
  }

  timerInterval = setInterval(() => {
    tickTimer();
  }, 250);
}

function sanitizeMinutes(minutes: number) {
  if (!Number.isFinite(minutes)) {
    return 1;
  }

  return Math.max(1, Math.min(180, Math.floor(minutes)));
}

function createWindow() {
  win = new BrowserWindow({
    width: 420,
    height: 560,
    icon: path.join(__dirname, "../build/icons/app.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false //avoid counting mistake
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // 渲染进程构建后的产物会在 dist 目录
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.webContents.on("did-finish-load", () => {
    publishTimerState();
  });
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("timer:get-state", async () => {
    return getPublicTimerState();
  });

  ipcMain.handle("timer:start", async () => {
    if (!timerState.running && timerState.remainingSec > 0) {
      timerState.running = true;
      timerState.endAt = Date.now() + timerState.remainingSec * 1000;
      startTicker();
      publishTimerState();
      tickTimer();
    }

    return getPublicTimerState();
  });

  ipcMain.handle("timer:pause", async () => {
    if (timerState.running && timerState.endAt) {
      timerState.remainingSec = Math.max(0, Math.ceil((timerState.endAt - Date.now()) / 1000));
      timerState.running = false;
      timerState.endAt = null;
      stopTicker();
      publishTimerState();
    }

    return getPublicTimerState();
  });

  ipcMain.handle("timer:reset", async () => {
    timerState.running = false;
    timerState.endAt = null;
    timerState.remainingSec = timerState.durationSec;
    stopTicker();
    publishTimerState();
    return getPublicTimerState();
  });

  ipcMain.handle("timer:apply-minutes", async (_event, minutes: number) => {
    const safeMinutes = sanitizeMinutes(minutes);

    if (!timerState.running) {
      timerState.durationSec = safeMinutes * 60;
      timerState.remainingSec = timerState.durationSec;
      timerState.endAt = null;
      publishTimerState();
    }

    return getPublicTimerState();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
