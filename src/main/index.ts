import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, Menu, Tray, nativeImage, type NativeImage } from 'electron'
import { join } from 'node:path'
import { captureRegion } from './capture'
import { draftReply, LlmError, testConnection } from './anythingllm'
import { buildPrompt, type Tone } from './persona'
import { sanitise } from './sanitise'
import { loadSettings, saveSettings, type Settings } from './settings'

let win: BrowserWindow | null = null
let tray: Tray | null = null
let quitting = false
let lastImage: NativeImage | null = null // kept in memory only, never written to disk

function createWindow(): BrowserWindow {
  const w = new BrowserWindow({
    width: 520,
    height: 700,
    show: false,
    title: 'AI Message Responder',
    webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, sandbox: true }
  })
  if (process.env['ELECTRON_RENDERER_URL']) w.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/main/index.html`)
  else w.loadFile(join(__dirname, '../renderer/main/index.html'))
  w.on('close', (e) => {
    if (!quitting) {
      e.preventDefault()
      w.hide()
    }
  })
  return w
}

async function startCapture(): Promise<void> {
  win?.hide()
  await new Promise((r) => setTimeout(r, 150)) // let the window disappear before grabbing the screen
  const img = await captureRegion()
  win?.show()
  if (!img) return
  lastImage = img
  win?.webContents.send('capture:done', img.toDataURL())
}

function registerHotkey(accelerator: string): boolean {
  globalShortcut.unregisterAll()
  try {
    return globalShortcut.register(accelerator, () => void startCapture())
  } catch {
    return false
  }
}

app.whenReady().then(() => {
  win = createWindow()
  registerHotkey(loadSettings().hotkey)
  tray = new Tray(nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFklEQVQ4jWNgGAWjYBSMglEwCkYBAAAEEAABZ0BdVQAAAABJRU5ErkJggg=='
  ))
  tray.setToolTip('AI Message Responder')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Capture message', click: () => void startCapture() },
    { label: 'Show window', click: () => win?.show() },
    { label: 'Quit', click: () => { quitting = true; app.quit() } }
  ]))
  tray.on('click', () => win?.show())
  win.once('ready-to-show', () => win?.show())

  ipcMain.handle('capture:start', () => startCapture())
  ipcMain.handle('settings:get', () => loadSettings())
  ipcMain.handle('settings:set', (_e, next: Settings) => {
    saveSettings(next)
    return registerHotkey(next.hotkey)
  })
  ipcMain.handle('settings:test', async (_e, cfg: Settings) => {
    try { await testConnection(cfg); return { ok: true } }
    catch (e) { return { ok: false, error: (e as Error).message } }
  })
  ipcMain.handle('draft:generate', async (_e, args: { instructions: string; tone: Tone }) => {
    if (!lastImage) return { ok: false, error: 'Capture a message first.' }
    const cfg = loadSettings()
    if (!cfg.apiKey || !cfg.workspace) {
      return { ok: false, error: 'Settings are not saved yet. Enter the API key and workspace slug, then click Save.' }
    }
    try {
      const text = await draftReply(cfg, buildPrompt(args.instructions, args.tone), lastImage.toDataURL())
      return { ok: true, text: sanitise(text) }
    } catch (e) {
      return { ok: false, error: e instanceof LlmError ? e.message : 'Something went wrong while drafting.' }
    }
  })
  ipcMain.handle('clipboard:write', (_e, text: string) => clipboard.writeText(text))
})

app.on('before-quit', () => { quitting = true })
app.on('will-quit', () => globalShortcut.unregisterAll())
app.on('window-all-closed', () => { /* stay in tray */ })
