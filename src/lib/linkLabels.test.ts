import { describe, expect, it } from 'vitest'

import { findVagueLinkLabels } from './linkLabels'

const withLink = (text: string) => ({
  root: { children: [{ type: 'paragraph', children: [{ type: 'link', children: [{ type: 'text', text }] }] }] },
})

describe('findVagueLinkLabels', () => {
  it('flags vague labels, case-insensitively', () => {
    expect(findVagueLinkLabels(withLink('cliquez ici'))).toEqual(['cliquez ici'])
    expect(findVagueLinkLabels(withLink('En Savoir Plus'))).toHaveLength(1)
    expect(findVagueLinkLabels(withLink('ICI'))).toHaveLength(1)
  })
  it('leaves explicit labels alone', () => {
    expect(findVagueLinkLabels(withLink('Voir nos tarifs'))).toEqual([])
  })
  it('handles null or empty content', () => {
    expect(findVagueLinkLabels(null)).toEqual([])
    expect(findVagueLinkLabels({})).toEqual([])
  })
})
