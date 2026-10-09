export {}
const api = (window as any).api
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const statusEl = $('status')
const draft = $<HTMLTextAreaElement>('draft')
const fields = ['baseUrl', 'apiKey', 'workspace', 'hotkey'] as const

const setStatus = (t: string) => { statusEl.textContent = t }
const readSettings = () => Object.fromEntries(fields.map((f) => [f, $<HTMLInputElement>(f).value.trim()]))

async function generate(tone: 'default' | 'casual' | 'formal') {
  setStatus('Drafting…')
  const res = await api.generate({ instructions: $<HTMLInputElement>('instr').value, tone })
  if (res.ok) { draft.value = res.text; setStatus('') } else setStatus(res.error)
}

api.onCaptured((dataUrl: string) => {
  const img = $<HTMLImageElement>('thumb')
  img.src = dataUrl
  img.hidden = false
  for (const id of ['gen', 'casual', 'formal']) $<HTMLButtonElement>(id).disabled = false
  void generate('default')
})

$('capture').onclick = () => api.startCapture()
$('gen').onclick = () => generate('default')
$('casual').onclick = () => generate('casual')
$('formal').onclick = () => generate('formal')
$('copy').onclick = async () => { await api.copy(draft.value); setStatus('Copied') }
$('save').onclick = async () => setStatus((await api.setSettings(readSettings())) ? 'Saved' : 'Saved, but that hotkey could not be registered')
$('test').onclick = async () => {
  setStatus('Testing…')
  const r = await api.testSettings(readSettings())
  setStatus(r.ok ? 'Connected' : r.error)
}

api.getSettings().then((s: Record<string, string>) => {
  for (const f of fields) $<HTMLInputElement>(f).value = s[f] ?? ''
  if (!s.apiKey || !s.workspace) ($('settings') as HTMLDetailsElement).open = true
})
