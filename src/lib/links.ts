import type { Contact } from '../payload-types'

// Structural, so it accepts a Page, a LegalPage, or any linkable doc with a slug.
type Linkable = { slug?: string | null; title?: string | null }
type PageRef = number | Linkable | null | undefined

type CtaLike = {
  label?: string | null
  action?: ('page' | 'phone' | 'email' | 'external' | string) | null
  page?: PageRef
  url?: string | null
}

/** A menu/footer link: a page reference with an optional override label. */
export const pageLink = (
  page: PageRef,
  label?: string | null,
): { href: string; label: string } | null => {
  if (!page || typeof page !== 'object') return null
  return { href: `/${page.slug}`, label: label || page.title || '' }
}

// Phone numbers keep only digits and a leading +, so tel: dials correctly.
const telHref = (phone?: string | null) =>
  phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null

/**
 * Resolve a call-to-action into an href + label. Phone and e-mail come from the
 * Contact global so the owner never retypes them; returns null when the target
 * is missing, so the caller can skip rendering a dead button.
 */
export const resolveCta = (
  cta: CtaLike | null | undefined,
  contact: Contact,
): { href: string; label: string } | null => {
  if (!cta?.label) return null

  switch (cta.action) {
    case 'phone': {
      const href = telHref(contact.phone)
      return href ? { href, label: cta.label } : null
    }
    case 'email': {
      return contact.email ? { href: `mailto:${contact.email}`, label: cta.label } : null
    }
    case 'external': {
      return cta.url ? { href: cta.url, label: cta.label } : null
    }
    case 'page':
    default: {
      const link = pageLink(cta.page, cta.label)
      return link
    }
  }
}
