import { describe, it, expect } from 'vitest'
import { formatBytes as fb } from '../domain/formatters/system'
import { formatBytes } from './system'

describe('utils system re-exports', () => {
  it('re-exports formatBytes', () => {
    expect(formatBytes(1024)).toBe(fb(1024))
  })
})
