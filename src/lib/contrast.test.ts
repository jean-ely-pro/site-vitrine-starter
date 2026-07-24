import { describe, expect, it } from 'vitest'

import { AA_CONTRAST, contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
  })
  it('passes AA for dark text on white and white on brand blue', () => {
    expect(contrastRatio('#1F2937', '#FFFFFF')!).toBeGreaterThanOrEqual(AA_CONTRAST)
    expect(contrastRatio('#FFFFFF', '#1D4ED8')!).toBeGreaterThanOrEqual(AA_CONTRAST)
  })
  it('flags the audit failures below AA', () => {
    // #EC4899 on white measured 3.53 in the prototype audit.
    expect(contrastRatio('#EC4899', '#FFFFFF')!).toBeLessThan(AA_CONTRAST)
  })
  it('is order-independent', () => {
    expect(contrastRatio('#123456', '#abcdef')).toBeCloseTo(
      contrastRatio('#abcdef', '#123456')!,
      5,
    )
  })
  it('returns null for an invalid hex', () => {
    expect(contrastRatio('nope', '#fff')).toBeNull()
  })
})
