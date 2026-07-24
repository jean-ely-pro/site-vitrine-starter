import { describe, expect, it } from 'vitest'

import type { Contact } from '../payload-types'
import { pageLink, resolveCta } from './links'

const contact = { phone: '04 78 12 34 56', email: 'bonjour@exemple.fr' } as Contact

describe('pageLink', () => {
  it('builds an href from a populated page', () => {
    expect(pageLink({ slug: 'services', title: 'Nos services' })).toEqual({
      href: '/services',
      label: 'Nos services',
    })
  })
  it('uses the override label when given', () => {
    expect(pageLink({ slug: 'a', title: 'A' }, 'Court')?.label).toBe('Court')
  })
  it('returns null for a missing or unpopulated page', () => {
    expect(pageLink(null)).toBeNull()
    expect(pageLink(42)).toBeNull()
  })
})

describe('resolveCta', () => {
  it('resolves a phone action to a tel: link', () => {
    expect(resolveCta({ label: 'Appeler', action: 'phone' }, contact)).toEqual({
      href: 'tel:0478123456',
      label: 'Appeler',
    })
  })
  it('resolves an email action to a mailto: link', () => {
    expect(resolveCta({ label: 'Écrire', action: 'email' }, contact)?.href).toBe(
      'mailto:bonjour@exemple.fr',
    )
  })
  it('resolves a page action via the relationship', () => {
    expect(
      resolveCta({ label: 'Voir', action: 'page', page: { slug: 'tarifs', title: 'Tarifs' } }, contact),
    ).toEqual({ href: '/tarifs', label: 'Voir' })
  })
  it('resolves an external action to its url', () => {
    expect(resolveCta({ label: 'Site', action: 'external', url: 'https://x.fr' }, contact)?.href).toBe(
      'https://x.fr',
    )
  })
  it('returns null without a label', () => {
    expect(resolveCta({ label: '', action: 'phone' }, contact)).toBeNull()
  })
  it('returns null when the target is missing', () => {
    expect(resolveCta({ label: 'Appeler', action: 'phone' }, {} as Contact)).toBeNull()
  })
})
