const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('belentani', {
  saveAs: (document) => ipcRenderer.invoke('storage:save-as', document),
  save: (filePath, document) => ipcRenderer.invoke('storage:save', filePath, document),
  open: () => ipcRenderer.invoke('storage:open'),
  autosave: (id, document) => ipcRenderer.invoke('storage:autosave', id, document),
  recoveries: () => ipcRenderer.invoke('storage:recoveries'),
  loadRecovery: (id) => ipcRenderer.invoke('storage:load-recovery', id),
  discardRecovery: (id) => ipcRenderer.invoke('storage:discard-recovery', id),
  openExternal: (url) => ipcRenderer.invoke('system:open-external', url)
})
