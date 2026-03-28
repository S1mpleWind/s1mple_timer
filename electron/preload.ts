import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("timerApi", {
  notifyFinished: (usedMinutes: number) => ipcRenderer.invoke("notify-finished", usedMinutes)
});
