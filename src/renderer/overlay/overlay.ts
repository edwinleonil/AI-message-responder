export {}
const api = (window as any).api
const bg = document.getElementById('bg') as HTMLImageElement
const sel = document.getElementById('sel') as HTMLDivElement
let start: { x: number; y: number } | null = null

api.onOverlayImage((d: string) => { bg.src = d })

function rectOf(e: MouseEvent) {
  const x = Math.min(start!.x, e.clientX), y = Math.min(start!.y, e.clientY)
  return { x, y, width: Math.abs(e.clientX - start!.x), height: Math.abs(e.clientY - start!.y) }
}

window.addEventListener('mousedown', (e) => { start = { x: e.clientX, y: e.clientY }; sel.style.display = 'block' })
window.addEventListener('mousemove', (e) => {
  if (!start) return
  const r = rectOf(e)
  Object.assign(sel.style, { left: r.x + 'px', top: r.y + 'px', width: r.width + 'px', height: r.height + 'px' })
})
window.addEventListener('mouseup', (e) => { if (start) api.overlayDone(rectOf(e)) })
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') api.overlayDone(null) })
