export interface LlmConfig {
  baseUrl: string
  apiKey: string
  workspace: string
}

export class LlmError extends Error {}

function url(cfg: LlmConfig, path: string): string {
  const base = cfg.baseUrl.trim().replace(/\/+$/, '').replace(/\/api(\/v1)?$/, '')
  return `${base}/api/v1${path}`
}

async function call(cfg: LlmConfig, path: string, init: RequestInit = {}, timeoutMs = 120_000): Promise<any> {
  let res: Response
  try {
    res = await fetch(url(cfg, path), {
      ...init,
      headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json', ...init.headers },
      signal: AbortSignal.timeout(timeoutMs)
    })
  } catch {
    throw new LlmError('Could not reach AnythingLLM. Check that it is running and the address is right.')
  }
  if (res.status === 401 || res.status === 403) throw new LlmError('AnythingLLM rejected the API key.')
  if (res.status === 404) {
    throw new LlmError(`AnythingLLM returned 404 for ${init.method ?? 'GET'} ${path}. Check the workspace slug (the part after /workspace/ in its URL) and the address.`)
  }
  if (!res.ok) throw new LlmError(`AnythingLLM returned an error (${res.status}) for ${path}.`)
  return res.json()
}

export async function testConnection(cfg: LlmConfig): Promise<void> {
  const auth = await call(cfg, '/auth', {}, 10_000)
  if (!auth?.authenticated) throw new LlmError('AnythingLLM rejected the API key.')
  const ws = await call(cfg, `/workspace/${encodeURIComponent(cfg.workspace)}`, {}, 10_000)
  if (!ws?.workspace || (Array.isArray(ws.workspace) && ws.workspace.length === 0)) {
    throw new LlmError(`Workspace "${cfg.workspace}" was not found.`)
  }
}

/** Sends the screenshot (PNG data URL) and prompt in a fresh thread, so drafts never bleed into each other. */
export async function draftReply(cfg: LlmConfig, prompt: string, imageDataUrl: string): Promise<string> {
  const ws = encodeURIComponent(cfg.workspace)
  let chatPath = `/workspace/${ws}/chat`
  let threadSlug: string | undefined
  try {
    const t = await call(cfg, `/workspace/${ws}/thread/new`, { method: 'POST', body: '{}' }, 15_000)
    threadSlug = t?.thread?.slug
    if (threadSlug) chatPath = `/workspace/${ws}/thread/${threadSlug}/chat`
  } catch (e) {
    if (e instanceof LlmError && /key/.test(e.message)) throw e
  }
  try {
    const body = {
      message: prompt,
      mode: 'chat',
      attachments: [{ name: 'message.png', mime: 'image/png', contentString: imageDataUrl }]
    }
    const out = await call(cfg, chatPath, { method: 'POST', body: JSON.stringify(body) })
    if (out?.error) throw new LlmError(String(out.error))
    if (!out?.textResponse) throw new LlmError('AnythingLLM returned an empty reply.')
    return String(out.textResponse)
  } finally {
    if (threadSlug) {
      call(cfg, `/workspace/${ws}/thread/${threadSlug}`, { method: 'DELETE' }, 10_000).catch(() => {})
    }
  }
}
