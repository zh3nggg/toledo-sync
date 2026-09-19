const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('toledo', {
  initial: () => ipcRenderer.invoke('app:initial'),
  chooseDirectory: (title) => ipcRenderer.invoke('dialog:directory', title),
  saveConfig: (values) => ipcRenderer.invoke('config:save', values),
  login: () => ipcRenderer.invoke('toledo:login'),
  discover: () => ipcRenderer.invoke('toledo:discover'),
  sync: (courseCode, selectedCodes) => ipcRenderer.invoke('toledo:sync', { courseCode, selectedCodes }),
  checkUpdates: (courseCode, selectedCodes) => ipcRenderer.invoke('toledo:check-updates', { courseCode, selectedCodes }),
  applyUpdates: (courseCode, selectedCodes) => ipcRenderer.invoke('toledo:apply-updates', { courseCode, selectedCodes }),
  openPath: (target) => ipcRenderer.invoke('path:open', target),
  onEvent: (listener) => ipcRenderer.on('toledo:event', (_event, payload) => listener(payload))
});
