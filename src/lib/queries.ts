import type {
  Actualite,
  Contact,
  Couleur,
  Horaire,
  Identite,
  LegalPage,
  Menu,
  Page,
  PiedDePage,
  Reseau,
} from '../payload-types'
import type { Where } from 'payload'
import { getPayloadClient } from './getPayload'
import { currentTenantDomain, currentTenantWhere } from './currentTenant'
import { serverUrl } from './constants'

/**
 * Site-wide data needed on every public page: identity, colours, navigation,
 * footer, contact, hours, social links. Fetched together so a page render is a
 * predictable set of queries.
 */
export type SiteGlobals = {
  identite: Identite
  couleurs: Couleur
  contact: Contact
  horaires: Horaire
  reseaux: Reseau
  menu: Menu
  piedDePage: PiedDePage
}

/**
 * The settings sections are now one document per client rather than Payload
 * globals, so each is a `find` filtered on the tenant instead of a `findGlobal`.
 * A missing section yields an empty object: a client who has not filled in their
 * social links yet must still get a rendered site.
 */
const tenantSettings = async <T>(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  slug: 'identite' | 'couleurs' | 'contact' | 'horaires' | 'reseaux' | 'menu' | 'pied-de-page',
  where: Where,
  depth = 0,
): Promise<T> => {
  const result = await payload.find({
    collection: slug,
    where,
    limit: 1,
    depth,
    overrideAccess: true,
  })
  return (result.docs[0] ?? {}) as T
}

export const getSiteGlobals = async (): Promise<SiteGlobals> => {
  const payload = await getPayloadClient()
  const where = await currentTenantWhere(payload)
  const [identite, couleurs, contact, horaires, reseaux, menu, piedDePage] = await Promise.all([
    tenantSettings<Identite>(payload, 'identite', where),
    tenantSettings<Couleur>(payload, 'couleurs', where),
    tenantSettings<Contact>(payload, 'contact', where),
    tenantSettings<Horaire>(payload, 'horaires', where),
    tenantSettings<Reseau>(payload, 'reseaux', where),
    tenantSettings<Menu>(payload, 'menu', where, 1),
    tenantSettings<PiedDePage>(payload, 'pied-de-page', where, 1),
  ])
  return { identite, couleurs, contact, horaires, reseaux, menu, piedDePage }
}

/** A single published page by slug, with its uploads populated. Null if none. */
export const getPublishedPage = async (slug: string): Promise<Page | null> => {
  const payload = await getPayloadClient()
  const tenantWhere = await currentTenantWhere(payload)
  const result = await payload.find({
    collection: 'pages',
    where: {
      and: [tenantWhere, { slug: { equals: slug } }, { _status: { equals: 'published' } }],
    },
    depth: 2,
    limit: 1,
  })
  return result.docs[0] ?? null
}

/** All published pages, lightest possible projection (for menus and sitemap). */
export const getPublishedPages = async (): Promise<Pick<Page, 'slug' | 'title' | 'updatedAt'>[]> => {
  const payload = await getPayloadClient()
  const tenantWhere = await currentTenantWhere(payload)
  const result = await payload.find({
    collection: 'pages',
    where: { and: [tenantWhere, { _status: { equals: 'published' } }] },
    depth: 0,
    limit: 500,
    pagination: false,
    select: { slug: true, title: true, updatedAt: true },
  })
  return result.docs
}

/** Published articles, newest first, with cover image and category populated. */
export const getPublishedArticles = async (): Promise<Actualite[]> => {
  const payload = await getPayloadClient()
  const tenantWhere = await currentTenantWhere(payload)
  const result = await payload.find({
    collection: 'actualites',
    where: { and: [tenantWhere, { _status: { equals: 'published' } }] },
    sort: '-publishedDate',
    depth: 1,
    limit: 500,
    pagination: false,
  })
  return result.docs
}

/** A single published legal page by slug. Null if none. */
export const getPublishedLegalPage = async (slug: string): Promise<LegalPage | null> => {
  const payload = await getPayloadClient()
  const tenantWhere = await currentTenantWhere(payload)
  const result = await payload.find({
    collection: 'legal-pages',
    where: {
      and: [tenantWhere, { slug: { equals: slug } }, { _status: { equals: 'published' } }],
    },
    depth: 1,
    limit: 1,
  })
  return result.docs[0] ?? null
}

/** Published legal pages, lightest projection — for the footer legal links. */
export const getPublishedLegalPages = async (): Promise<Pick<LegalPage, 'slug' | 'title'>[]> => {
  const payload = await getPayloadClient()
  const tenantWhere = await currentTenantWhere(payload)
  const result = await payload.find({
    collection: 'legal-pages',
    where: { and: [tenantWhere, { _status: { equals: 'published' } }] },
    depth: 0,
    limit: 50,
    pagination: false,
    select: { slug: true, title: true },
  })
  return result.docs
}

/** A single published article by slug, with uploads populated. Null if none. */
export const getPublishedArticle = async (slug: string): Promise<Actualite | null> => {
  const payload = await getPayloadClient()
  const tenantWhere = await currentTenantWhere(payload)
  const result = await payload.find({
    collection: 'actualites',
    where: {
      and: [tenantWhere, { slug: { equals: slug } }, { _status: { equals: 'published' } }],
    },
    depth: 2,
    limit: 1,
  })
  return result.docs[0] ?? null
}

/**
 * The public address of the site being rendered.
 *
 * Prefers the client's own domain, recorded on their tenant, and falls back to
 * `SERVER_URL`. On a dedicated instance nothing changes — no tenant domain is
 * set, so the environment wins. On a mutualised one, `SERVER_URL` is the
 * platform's own back-office address: using it would make every published site
 * advertise a sitemap that no visitor can reach.
 */
export const publicSiteUrl = async (): Promise<string> => {
  try {
    const payload = await getPayloadClient()
    const domain = await currentTenantDomain(payload)
    if (domain) return domain
  } catch {
    // Base injoignable (construction de l'image) : le repli suffit.
  }
  return serverUrl()
}
