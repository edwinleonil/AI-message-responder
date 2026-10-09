export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Converts a selection in CSS pixels to a clamped rectangle in physical image pixels. */
export function toImageRect(sel: Rect, scaleFactor: number, image: { width: number; height: number }): Rect {
  const x = Math.max(0, Math.min(image.width - 1, Math.round(sel.x * scaleFactor)))
  const y = Math.max(0, Math.min(image.height - 1, Math.round(sel.y * scaleFactor)))
  const width = Math.max(1, Math.min(image.width - x, Math.round(sel.width * scaleFactor)))
  const height = Math.max(1, Math.min(image.height - y, Math.round(sel.height * scaleFactor)))
  return { x, y, width, height }
}
