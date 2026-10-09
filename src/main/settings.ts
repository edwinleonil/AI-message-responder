import { app, safeStorage } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface Settings {
  baseUrl: string
  apiKey: string
  workspace: string
  hotkey: string
}

const DEFAULTS: Settings = {
  baseUrl: 'http://localhost:3001',
  apiKey: '',
  workspace: '',
  hotkey: 'CommandOrControl+Shift+R'
}

const file = () => join(app.getPath('userData'), 'settings.json')

export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(readFileSync(file(), 'utf8'))
    const key = raw.apiKeyEnc && safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(Buffer.from(raw.apiKeyEnc, 'base64'))
      : ''
    return { ...DEFAULTS, ...raw, apiKey: key, apiKeyEnc: undefined }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(s: Settings): void {
  const { apiKey, ...rest } = s
  const apiKeyEnc = apiKey && safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(apiKey).toString('base64')
    : ''
  writeFileSync(file(), JSON.stringify({ ...rest, apiKeyEnc }, null, 2))
}
