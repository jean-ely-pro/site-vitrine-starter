import type { MetadataRoute } from 'next'

import { HOME_SLUG } from '../lib/constants'
import {
  getPublishedArticles,
  getPublishedLegalPages,
  getPublishedPages,
  publicSiteUrl,
} from '../lib/queries'

// Built per request rather than at build time: it must reflect the content that
// exists now, and the image has to build without a database.
export const dynamic = 'force-dynamic'

// Lists every published page and article. The home page appears once, at "/".
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await publicSiteUrl()
  const [pages, articles, legalPages] = await Promise.all([
    getPublishedPages(),
    getPublishedArticles(),
    getPublishedLegalPages(),
  ])

  const pageEntries: MetadataRoute.Sitemap = pages
    .filter((page) => page.slug)
    .map((page) => ({
      url: new URL(page.slug === HOME_SLUG ? '/' : `/${page.slug}`, base).toString(),
      lastModified: page.updatedAt ?? undefined,
    }))

  const articleEntries: MetadataRoute.Sitemap = articles
    .filter((article) => article.slug)
    .map((article) => ({
      url: new URL(`/actualites/${article.slug}`, base).toString(),
      lastModified: article.updatedAt ?? undefined,
    }))

  // The news index itself, listed once when at least one article exists.
  const indexEntry: MetadataRoute.Sitemap = articleEntries.length
    ? [{ url: new URL('/actualites', base).toString() }]
    : []

  const legalEntries: MetadataRoute.Sitemap = legalPages
    .filter((legal) => legal.slug)
    .map((legal) => ({ url: new URL(`/${legal.slug}`, base).toString() }))

  return [...pageEntries, ...indexEntry, ...articleEntries, ...legalEntries]
}
