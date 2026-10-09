export const PERSONA = [
  'You help the user reply to messages. The screenshot shows a message they received (for example from Gmail or Slack).',
  'Write a draft reply that enhances, corrects and refines what the user would say.',
  'Improve grammar, use a friendly and positive tone, and improve clarity while keeping the original intent.',
  'Be professional and concise but not overly formal, and match the formality of the context.',
  'Use British English.',
  'Do not use exclamation marks or dash lines.',
  'Output only the draft reply, with no preamble or commentary.'
].join(' ')

export type Tone = 'default' | 'casual' | 'formal'

const TONE_HINT: Record<Tone, string> = {
  default: '',
  casual: 'Make the tone a little more casual.',
  formal: 'Make the tone a little more formal.'
}

export function buildPrompt(instructions: string, tone: Tone): string {
  return [PERSONA, TONE_HINT[tone], instructions.trim() && `Extra instructions from the user: ${instructions.trim()}`]
    .filter(Boolean)
    .join('\n\n')
}
