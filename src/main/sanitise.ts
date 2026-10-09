/** Enforces the hard style rules whatever the model returns: no exclamation marks, no dash lines. */
export function sanitise(text: string): string {
  return text
    .replace(/^[ \t]*[-*][ \t]+/gm, '') // dash bullets
    .replace(/[ \t]*[–—][ \t]*/g, ', ') // en and em dashes
    .replace(/[ \t]+-{1,2}[ \t]+/g, ', ') // spaced hyphens used as punctuation
    .replace(/([?!.])?!+/g, (_m, p) => (p === '?' ? '?' : '.')) // exclamation marks
    .replace(/\.{2,}(?!\.)/g, '.')
    .replace(/,\s*([.?])/g, '$1')
    .replace(/[ \t]+$/gm, '')
    .trim()
}
