import { describe, expect, it } from 'vitest'

import { slugify } from './slugify'

describe('slugify', () => {
  it('lower-cases and hyphenates', () => {
    expect(slugify('Nos Services')).toBe('nos-services')
  })
  it('strips accents', () => {
    expect(slugify('Élégance café')).toBe('elegance-cafe')
    expect(slugify('À propos')).toBe('a-propos')
  })
  it('collapses punctuation and trims hyphens', () => {
    expect(slugify('  Tarifs & Devis !  ')).toBe('tarifs-devis')
    expect(slugify('Bonjour, le Monde')).toBe('bonjour-le-monde')
  })
  it('handles empty input', () => {
    expect(slugify('')).toBe('')
    expect(slugify('   ')).toBe('')
  })
})
