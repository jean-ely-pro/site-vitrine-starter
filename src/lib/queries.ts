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
import { getPayloadClient } from './getPayload'

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

export const getSiteGlobals = async (): Promise<SiteGlobals> => {
  const payload = await getPayloadClient()
  const [identite, couleurs, contact, horaires, reseaux, menu, piedDePage] = await Promise.all([
    payload.findGlobal({ slug: 'identite' }),
    payload.findGlobal({ slug: 'couleurs' }),
    payload.findGlobal({ slug: 'contact' }),
    payload.findGlobal({ slug: 'horaires' }),
    payload.findGlobal({ slug: 'reseaux' }),
    payload.findGlobal({ slug: 'menu', depth: 1 }),
    payload.findGlobal({ slug: 'pied-de-page', depth: 1 }),
  ])
  return { identite, couleurs, contact, horaires, reseaux, menu, piedDePage }
}

/** A single published page by slug, with its uploads populated. Null if none. */
export const getPublishedPage = async (slug: string): Promise<Page | null> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
    },
    depth: 2,
    limit: 1,
  })
  return result.docs[0] ?? null
}

/** All published pages, lightest possible projection (for menus and sitemap). */
export const getPublishedPages = async (): Promise<Pick<Page, 'slug' | 'title' | 'updatedAt'>[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
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
  const result = await payload.find({
    collection: 'actualites',
    where: { _status: { equals: 'published' } },
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
  const result = await payload.find({
    collection: 'legal-pages',
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
    },
    depth: 1,
    limit: 1,
  })
  return result.docs[0] ?? null
}

/** Published legal pages, lightest projection — for the footer legal links. */
export const getPublishedLegalPages = async (): Promise<Pick<LegalPage, 'slug' | 'title'>[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'legal-pages',
    where: { _status: { equals: 'published' } },
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
  const result = await payload.find({
    collection: 'actualites',
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
    },
    depth: 2,
    limit: 1,
  })
  return result.docs[0] ?? null
}
