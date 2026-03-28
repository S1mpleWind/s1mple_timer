import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("timerApi", {
  getTimerState: () => ipcRenderer.invoke("timer:get-state"),
  startTimer: () => ipcRenderer.invoke("timer:start"),
  pauseTimer: () => ipcRenderer.invoke("timer:pause"),
  resetTimer: () => ipcRenderer.invoke("timer:reset"),
  applyMinutes: (minutes: number) => ipcRenderer.invoke("timer:apply-minutes", minutes),
  onTimerState: (callback: (state: { running: boolean; durationSec: number; remainingSec: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: { running: boolean; durationSec: number; remainingSec: number }) => {
      callback(state);
    };

    ipcRenderer.on("timer:state", handler);

    return () => {
      ipcRenderer.removeListener("timer:state", handler);
    };
  }
});
