import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  startCapture: () => ipcRenderer.invoke('capture:start'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (s: unknown) => ipcRenderer.invoke('settings:set', s),
  testSettings: (s: unknown) => ipcRenderer.invoke('settings:test', s),
  generate: (args: unknown) => ipcRenderer.invoke('draft:generate', args),
  copy: (text: string) => ipcRenderer.invoke('clipboard:write', text),
  onCaptured: (cb: (dataUrl: string) => void) => ipcRenderer.on('capture:done', (_e, d) => cb(d)),
  onOverlayImage: (cb: (dataUrl: string) => void) => ipcRenderer.on('overlay:image', (_e, d) => cb(d)),
  overlayDone: (rect: unknown) => ipcRenderer.send('overlay:done', rect)
})
