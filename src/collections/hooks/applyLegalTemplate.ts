import type { CollectionBeforeChangeHook } from 'payload'

import { buildLegalContent, LEGAL_TITLES, type LegalData, type LegalType } from '../../lib/legalTemplates'

// Canonical public addresses for each legal page.
const SLUGS: Record<LegalType, string> = {
  'mentions-legales': 'mentions-legales',
  confidentialite: 'politique-de-confidentialite',
  cgu: 'cgu',
}

/**
 * On creation, pre-fill a legal page from the company data (Identité + Contact):
 * title, canonical slug, and real editable French text. Runs only on create, so
 * editing an existing legal page never overwrites the owner's changes.
 */
export const applyLegalTemplate: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data

  const type = data.type as LegalType | undefined
  if (!type) return data

  const [identite, contact] = await Promise.all([
    req.payload.findGlobal({ slug: 'identite' }),
    req.payload.findGlobal({ slug: 'contact' }),
  ])

  const legalData: LegalData = {
    companyName: (identite as { companyName?: string }).companyName,
    legalName: (identite as { legalName?: string }).legalName,
    siret: (identite as { siret?: string }).siret,
    address: (identite as { address?: LegalData['address'] }).address,
    email: (contact as { email?: string }).email,
    phone: (contact as { phone?: string }).phone,
  }

  return {
    ...data,
    title: data.title || LEGAL_TITLES[type],
    slug: data.slug || SLUGS[type],
    content: data.content ?? buildLegalContent(type, legalData),
  }
}
