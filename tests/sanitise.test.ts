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

describe('toImageRect', () => {
  it('scales and clamps', () => {
    expect(toImageRect({ x: 10, y: 10, width: 100, height: 50 }, 1.5, { width: 1920, height: 1080 })).toEqual({ x: 15, y: 15, width: 150, height: 75 })
    expect(toImageRect({ x: 1900, y: 1000, width: 500, height: 500 }, 1, { width: 1920, height: 1080 })).toEqual({ x: 1900, y: 1000, width: 20, height: 80 })
  })
})
