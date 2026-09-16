import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('toledo', {
  initial: () => ipcRenderer.invoke('app:initial'),
  chooseDirectory: (title) => ipcRenderer.invoke('dialog:directory', title),
  saveConfig: (values) => ipcRenderer.invoke('config:save', values),
  login: () => ipcRenderer.invoke('toledo:login'),
  discover: () => ipcRenderer.invoke('toledo:discover'),
  sync: (courseCode) => ipcRenderer.invoke('toledo:sync', courseCode),
  openPath: (target) => ipcRenderer.invoke('path:open', target),
  onEvent: (listener) => ipcRenderer.on('toledo:event', (_event, payload) => listener(payload))
});
