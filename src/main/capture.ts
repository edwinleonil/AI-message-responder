import { BrowserWindow, desktopCapturer, ipcMain, screen, type NativeImage } from 'electron'
import { join } from 'node:path'
import { toImageRect, type Rect } from './crop'

/** Shows a region-selection overlay over the display under the cursor. Resolves with the cropped image, or null if cancelled. */
export async function captureRegion(): Promise<NativeImage | null> {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const size = { width: Math.round(display.size.width * display.scaleFactor), height: Math.round(display.size.height * display.scaleFactor) }
  // DXGI duplication can fail on a static screen, so retry until a non-empty frame comes back
  let full: NativeImage | null = null
  for (let attempt = 0; attempt < 4 && !full; attempt++) {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: size })
    const source = sources.find((s) => s.display_id === String(display.id)) ?? sources[0]
    if (source && !source.thumbnail.isEmpty()) full = source.thumbnail
    else await new Promise((r) => setTimeout(r, 200))
  }
  if (!full) return null

  const win = new BrowserWindow({
    ...display.bounds,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    fullscreenable: false,
    webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, sandbox: true }
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  if (process.env['ELECTRON_RENDERER_URL']) await win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay/index.html`)
  else await win.loadFile(join(__dirname, '../renderer/overlay/index.html'))
  win.webContents.send('overlay:image', full.toDataURL())
  win.focus()

  return new Promise((resolve) => {
    let settled = false
    const finish = (result: NativeImage | null) => {
      if (settled) return
      settled = true
      ipcMain.removeAllListeners('overlay:done')
      if (!win.isDestroyed()) win.close()
      resolve(result)
    }
    ipcMain.once('overlay:done', (_e, sel: Rect | null) => {
      if (!sel || sel.width < 5 || sel.height < 5) return finish(null)
      finish(full.crop(toImageRect(sel, display.scaleFactor, full.getSize())))
    })
    win.on('closed', () => finish(null))
  })
}
