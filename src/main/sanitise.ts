/** Pulls just the reply out of a model response: drops reasoning blocks, preambles, trailing notes and markdown wrapping. */
export function extractDraft(text: string): string {
  let t = text
    .replace(/<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi, '')
    .replace(/^[\s\S]*?<\/(think|thinking|reasoning)>/i, '') // unclosed opening tag stripped by the server
    .trim()

  // A horizontal rule or code fence usually brackets the real draft: prefer the first block between them.
  const fenced = t.match(/```[a-z]*\n([\s\S]*?)```/i)
  if (fenced) t = fenced[1].trim()
  else if (/^\s*([-*_]){3,}\s*$/m.test(t)) {
    const parts = t.split(/^\s*(?:[-*_]){3,}\s*$/m).map((p) => p.trim()).filter(Boolean)
    if (parts.length) t = parts.length >= 3 ? parts[1] : parts.reduce((a, b) => (b.length > a.length ? b : a))
  }

  const lines = t.split('\n')
  // Leading chatter such as "Here's a draft reply:" or "Sure, here you go".
  while (lines.length > 1 && /^\s*(\*\*)?(sure|certainly|of course|here('s| is| are)|draft( reply)?:?|subject:)/i.test(lines[0])) {
    lines.shift()
    while (lines.length && !lines[0].trim()) lines.shift()
  }
  // Trailing commentary such as "Note: ..." or "Let me know if you'd like changes".
  while (lines.length > 1) {
    const last = lines[lines.length - 1].trim()
    if (!last || /^(\*\*)?(note|notes|tip|i('ve| have| kept| used| made| changed)|let me know|feel free|this (draft|reply|version))/i.test(last)) lines.pop()
    else break
  }

  return lines
    .join('\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^["“](.*)["”]$/s, '$1')
    .trim()
}

/** Enforces the hard style rules whatever the model returns: no exclamation marks, no dash lines. */
export function sanitise(text: string): string {
  return extractDraft(text)
    .replace(/^[ \t]*[-*][ \t]+/gm, '') // dash bullets
    .replace(/[ \t]*[–—][ \t]*/g, ', ') // en and em dashes
    .replace(/[ \t]+-{1,2}[ \t]+/g, ', ') // spaced hyphens used as punctuation
    .replace(/([?!.])?!+/g, (_m, p) => (p === '?' ? '?' : '.')) // exclamation marks
    .replace(/\.{2,}(?!\.)/g, '.')
    .replace(/,\s*([.?])/g, '$1')
    .replace(/[ \t]+$/gm, '')
    .trim()
}
