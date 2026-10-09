import { describe, expect, it } from 'vitest'
import { sanitise } from '../src/main/sanitise'
import { toImageRect } from '../src/main/crop'

describe('sanitise', () => {
  it('removes exclamation marks', () => {
    expect(sanitise('Thanks so much! See you soon!!')).toBe('Thanks so much. See you soon.')
    expect(sanitise('Really?!')).toBe('Really?')
  })
  it('removes dash punctuation but keeps compound hyphens', () => {
    expect(sanitise('Great - see you')).toBe('Great, see you')
    expect(sanitise('Great — see you – soon')).toBe('Great, see you, soon')
    expect(sanitise('A follow-up call')).toBe('A follow-up call')
  })
  it('strips dash bullets', () => {
    expect(sanitise('- one\n- two')).toBe('one\ntwo')
  })
})

describe('extractDraft', () => {
  it('drops preamble and trailing notes', () => {
    expect(sanitise("Here's a draft reply:\n\nHi Sam,\n\nThanks for the update.\n\nKind regards\n\nNote: I kept it brief.")).toBe('Hi Sam,\n\nThanks for the update.\n\nKind regards')
  })
  it('drops reasoning blocks', () => {
    expect(sanitise('<think>plan the reply</think>\nThanks, that works.')).toBe('Thanks, that works.')
  })
  it('takes the draft between horizontal rules', () => {
    expect(sanitise('Sure thing\n---\nSounds good, see you then.\n---\nLet me know if you want changes')).toBe('Sounds good, see you then.')
  })
  it('removes wrapping quotes and markdown', () => {
    expect(sanitise('"**Thanks** for this."')).toBe('Thanks for this.')
  })
})

describe('toImageRect', () => {
  it('scales and clamps', () => {
    expect(toImageRect({ x: 10, y: 10, width: 100, height: 50 }, 1.5, { width: 1920, height: 1080 })).toEqual({ x: 15, y: 15, width: 150, height: 75 })
    expect(toImageRect({ x: 1900, y: 1000, width: 500, height: 500 }, 1, { width: 1920, height: 1080 })).toEqual({ x: 1900, y: 1000, width: 20, height: 80 })
  })
})
